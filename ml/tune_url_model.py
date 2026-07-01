"""Optuna hyperparameter search for the URL XGBoost model.

Runs 60 trials of 3-fold CV on the training split, then retrains the best
params on the full train set, evaluates on held-out test, and overwrites
the model artifact if the new ROC-AUC beats the current one.
"""
import os
import sys

import joblib
import numpy as np
import optuna
from sklearn.metrics import (
    accuracy_score, confusion_matrix, precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
import xgboost as xgb

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from backend.ml.features import FEATURE_NAMES
from ml.train import ARTIFACT_PATH, build_feature_matrix, load_dataset

optuna.logging.set_verbosity(optuna.logging.WARNING)


def objective(trial, X_train, y_train):
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 200, 800),
        "max_depth": trial.suggest_int("max_depth", 3, 10),
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
        "subsample": trial.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
        "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
        "gamma": trial.suggest_float("gamma", 0.0, 1.0),
        "eval_metric": "logloss",
        "random_state": 42,
    }
    model = xgb.XGBClassifier(**params)
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="roc_auc")
    return scores.mean()


def tune():
    print("Loading dataset and building features...")
    df = load_dataset()
    X = build_feature_matrix(df)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train: {len(X_train)} rows  |  Test: {len(X_test)} rows")

    print("Running 60 Optuna trials (3-fold CV each)...")
    study = optuna.create_study(direction="maximize")
    study.optimize(lambda t: objective(t, X_train, y_train), n_trials=60, show_progress_bar=False)

    best = study.best_params
    best_cv_auc = study.best_value
    print(f"\nBest CV ROC-AUC: {best_cv_auc:.4f}")
    print(f"Best params: {best}")

    print("\nRetraining on full train split with best params...")
    best_model = xgb.XGBClassifier(**best, eval_metric="logloss", random_state=42)
    best_model.fit(X_train, y_train)

    y_pred = best_model.predict(X_test)
    y_proba = best_model.predict_proba(X_test)[:, 1]
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    new_metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
        "detection_rate": round(recall_score(y_test, y_pred), 4),
        "false_positive_rate": round(float(fp) / float(fp + tn), 4) if (fp + tn) > 0 else 0.0,
    }
    print(f"Tuned XGBoost test metrics: {new_metrics}")

    bundle = joblib.load(ARTIFACT_PATH)
    old_auc = bundle["metrics"].get("xgboost", bundle["metrics"].get("random_forest", {})).get("roc_auc", 0)
    print(f"\nOld best ROC-AUC: {old_auc}  →  New: {new_metrics['roc_auc']}")

    if new_metrics["roc_auc"] >= old_auc:
        joblib.dump({
            "model": best_model,
            "model_type": "xgboost_tuned",
            "feature_names": FEATURE_NAMES,
            "metrics": {"xgboost_tuned": new_metrics},
            "best_params": best,
        }, ARTIFACT_PATH)
        print("Artifact updated.")
    else:
        print("New model did not beat old — artifact unchanged.")

    return new_metrics


if __name__ == "__main__":
    tune()
