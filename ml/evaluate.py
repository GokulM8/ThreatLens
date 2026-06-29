"""Loads the trained URL model artifact, re-scores it against a freshly
generated dataset, and prints metrics plus global SHAP feature importance."""
import os
import sys

import joblib
import numpy as np
import shap
from sklearn.metrics import (
    accuracy_score, confusion_matrix, precision_score, recall_score, roc_auc_score,
)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from backend.ml.explainer import _positive_class_shap_values  # noqa: E402
from ml.train import ARTIFACT_PATH, build_feature_matrix, load_dataset  # noqa: E402


def evaluate():
    if not os.path.exists(ARTIFACT_PATH):
        raise SystemExit("No trained model found — run `python ml/train.py` first.")

    bundle = joblib.load(ARTIFACT_PATH)
    model = bundle["model"]
    feature_names = bundle["feature_names"]
    print(f"Loaded {bundle['model_type']} model")
    print("Stored training metrics:", bundle["metrics"])

    df = load_dataset()
    X = build_feature_matrix(df)
    y = df["label"]

    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)[:, 1]
    print("\nFull-dataset re-evaluation:")
    print({
        "accuracy": round(accuracy_score(y, y_pred), 4),
        "precision": round(precision_score(y, y_pred), 4),
        "recall": round(recall_score(y, y_pred), 4),
        "roc_auc": round(roc_auc_score(y, y_proba), 4),
    })
    print("Confusion matrix [[TN, FP], [FN, TP]]:")
    print(confusion_matrix(y, y_pred))

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    values = _positive_class_shap_values(shap_values)
    mean_abs = np.abs(values).mean(axis=0)
    ranked = sorted(zip(feature_names, mean_abs), key=lambda x: x[1], reverse=True)

    print("\nTop 5 globally important features (mean |SHAP|):")
    for name, val in ranked[:5]:
        print(f"  {name}: {val:.4f}")


if __name__ == "__main__":
    evaluate()
