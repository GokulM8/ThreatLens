"""Trains the URL risk model (RandomForest + XGBoost, best-of-two by ROC-AUC).

Looks for a PhiUSIIL-format CSV at ml/data/PhiUSIIL_Phishing_URL_Dataset.csv.
If absent, generates a synthetic dataset of 500 legit + 500 phishing URLs
(typosquats of real Indian broker/exchange domains, IP hosts, keyword
stuffing, etc.) so the pipeline runs end-to-end with zero external data.

domain_age_proxy / redirect_count / external_resources_count /
form_action_external are network-derived features (see
backend/ml/features.py). Resolving them live for every training row would be
slow and non-reproducible, so synthetic rows get label-correlated synthetic
values for those four columns instead; real PhiUSIIL rows get the "unknown"
sentinel (-1 / 0) since that dataset has no live signal to offer.
"""
import os
import random
import string
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, confusion_matrix, precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import train_test_split

try:
    import xgboost as xgb
except Exception as exc:
    # On macOS, xgboost needs the libomp runtime from Homebrew
    # (`brew install libomp`); without it, importing xgboost raises
    # xgboost.core.XGBoostError at dlopen time, not ImportError. Degrade
    # to RandomForest-only rather than hard-failing the whole training
    # pipeline over a missing optional native dependency.
    xgb = None
    print(f"xgboost unavailable ({exc}); training RandomForest only.")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from backend.ml.features import (  # noqa: E402
    FEATURE_NAMES, KNOWN_BROKER_DOMAINS, UNKNOWN_DOMAIN_AGE, extract_features,
)

LIVE_SIGNAL_COLUMNS = [
    "domain_age_proxy", "redirect_count", "external_resources_count", "form_action_external",
]

DATA_PATH = os.path.join(ROOT_DIR, "ml", "data", "PhiUSIIL_Phishing_URL_Dataset.csv")
ARTIFACT_DIR = os.path.join(ROOT_DIR, "backend", "ml", "artifacts")
ARTIFACT_PATH = os.path.join(ARTIFACT_DIR, "url_model.pkl")

# PhiUSIIL's "label" column uses 1 = legitimate, 0 = phishing. Flip this if
# you download a CSV variant that encodes it the other way around.
PHIUSIIL_PHISHING_LABEL_VALUE = 0

PHISHING_KEYWORDS = ["login", "secure", "verify", "kyc", "update", "confirm", "reward", "bonus"]


def _random_string(n: int) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def _typosquat(domain: str) -> str:
    name, _, tld = domain.rpartition(".")
    style = random.randint(0, 4)
    if style == 0:  # character substitution
        idx = random.randrange(len(name))
        chars = list(name)
        chars[idx] = random.choice(string.ascii_lowercase)
        name = "".join(chars)
    elif style == 1:  # character insertion
        idx = random.randrange(len(name) + 1)
        name = name[:idx] + random.choice(string.ascii_lowercase) + name[idx:]
    elif style == 2:  # hyphenated keyword prefix
        name = f"{random.choice(PHISHING_KEYWORDS)}-{name}"
    elif style == 3:  # TLD swap
        tld = random.choice(["xyz", "tk", "info", "co", "online"])
    else:  # doubled letter
        idx = random.randrange(len(name))
        name = name[:idx] + name[idx] + name[idx:]
    return f"{name}.{tld}"


def _generate_legit_url() -> tuple:
    domain = random.choice(KNOWN_BROKER_DOMAINS)
    path = random.choice([
        "", "/dashboard", "/portfolio", "/markets/nifty50", "/research/reports",
        "/account/statements", "/help", "/ipo/upcoming",
    ])
    sub = random.choice(["", "www.", "secure."])
    live_signals = (
        random.randint(400, 6000),                       # domain_age_proxy
        random.choices([0, 1], weights=[0.9, 0.1])[0],    # redirect_count
        random.randint(0, 3),                             # external_resources_count
        0,                                                 # form_action_external
    )
    return f"https://{sub}{domain}{path}", live_signals


def _generate_phishing_url() -> tuple:
    base_domain = random.choice(KNOWN_BROKER_DOMAINS)
    style = random.randint(0, 3)
    keyword = random.choice(PHISHING_KEYWORDS)
    suffix = _random_string(random.randint(4, 8))

    if style == 0:
        ip = ".".join(str(random.randint(1, 254)) for _ in range(4))
        url = f"http://{ip}/{keyword}-{base_domain.split('.')[0]}/{suffix}"
    elif style == 1:
        squat = _typosquat(base_domain)
        url = f"http://{squat}/{keyword}/{suffix}"
    elif style == 2:
        url = f"http://{base_domain.split('.')[0]}.com@{suffix}.{_random_string(6)}.com/{keyword}"
    else:
        squat = _typosquat(base_domain)
        url = f"http://{keyword}.{squat.replace('.', '-', 1)}/{keyword}/{suffix}/{suffix}"

    live_signals = (
        random.randint(1, 300),                                       # domain_age_proxy
        random.choices([0, 1, 2, 3], weights=[0.3, 0.3, 0.25, 0.15])[0],  # redirect_count
        random.randint(3, 12),                                        # external_resources_count
        random.choices([0, 1], weights=[0.4, 0.6])[0],                # form_action_external
    )
    return url, live_signals


def generate_synthetic_dataset(n_legit: int = 500, n_phishing: int = 500) -> pd.DataFrame:
    rows = []
    for _ in range(n_legit):
        url, signals = _generate_legit_url()
        rows.append({"url": url, "label": 0, **dict(zip(LIVE_SIGNAL_COLUMNS, signals))})
    for _ in range(n_phishing):
        url, signals = _generate_phishing_url()
        rows.append({"url": url, "label": 1, **dict(zip(LIVE_SIGNAL_COLUMNS, signals))})
    random.shuffle(rows)
    return pd.DataFrame(rows)


def load_dataset() -> pd.DataFrame:
    if os.path.exists(DATA_PATH):
        print(f"Loading PhiUSIIL dataset from {DATA_PATH}")
        raw = pd.read_csv(DATA_PATH)
        url_col = "url" if "url" in raw.columns else "URL"
        label_col = "label" if "label" in raw.columns else "Label"
        df = pd.DataFrame({
            "url": raw[url_col],
            "label": (raw[label_col] == PHIUSIIL_PHISHING_LABEL_VALUE).astype(int),
        })
        df["domain_age_proxy"] = UNKNOWN_DOMAIN_AGE
        df["redirect_count"] = 0
        df["external_resources_count"] = 0
        df["form_action_external"] = 0
        return df

    print("No PhiUSIIL CSV found, generating synthetic dataset (500 legit + 500 phishing)")
    return generate_synthetic_dataset()


def build_feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, row in df.iterrows():
        features = extract_features(row["url"], check_live_signals=False)
        for col in LIVE_SIGNAL_COLUMNS:
            features[col] = row[col]
        rows.append(features)
    return pd.DataFrame(rows, columns=FEATURE_NAMES)


def train():
    df = load_dataset()
    X = build_feature_matrix(df)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    candidates = {
        "random_forest": RandomForestClassifier(
            n_estimators=200, class_weight="balanced", random_state=42
        ),
    }
    if xgb is not None:
        candidates["xgboost"] = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            eval_metric="logloss",
            random_state=42,
        )

    results = {}
    for name, clf in candidates.items():
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        y_proba = clf.predict_proba(X_test)[:, 1]
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        metrics = {
            "accuracy": round(accuracy_score(y_test, y_pred), 4),
            "precision": round(precision_score(y_test, y_pred), 4),
            "recall": round(recall_score(y_test, y_pred), 4),
            "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
            # recall, read as "% of real phishing URLs caught" — drives the
            # dashboard's DETECTION figure
            "detection_rate": round(recall_score(y_test, y_pred), 4),
            # FP / (FP + TN) — % of legit URLs wrongly flagged — drives the
            # dashboard's FALSE POS figure. Both are real holdout metrics
            # from this training run, not invented UI numbers.
            "false_positive_rate": round(float(fp) / float(fp + tn), 4) if (fp + tn) > 0 else 0.0,
        }
        results[name] = {"model": clf, "metrics": metrics}
        print(f"{name}: {metrics}")

    best_name = max(results, key=lambda n: results[n]["metrics"]["roc_auc"])
    best_model = results[best_name]["model"]
    print(f"Selected best model: {best_name}")

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    joblib.dump({
        "model": best_model,
        "model_type": best_name,
        "feature_names": FEATURE_NAMES,
        "metrics": {name: r["metrics"] for name, r in results.items()},
    }, ARTIFACT_PATH)
    print(f"Saved model to {ARTIFACT_PATH}")
    return results


if __name__ == "__main__":
    train()
