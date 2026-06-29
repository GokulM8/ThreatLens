"""Loads the trained URL risk model artifact and exposes a scoring API."""
import os
import joblib
import pandas as pd

from .features import FEATURE_NAMES, extract_features
from .rules_engine import evaluate_rules, load_rules
from .explainer import top_shap_contributions

ARTIFACT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "artifacts", "url_model.pkl"
)

_bundle = None
_rules_config = load_rules()


class ModelNotTrainedError(RuntimeError):
    pass


def get_bundle() -> dict:
    global _bundle
    if _bundle is None:
        if not os.path.exists(ARTIFACT_PATH):
            raise ModelNotTrainedError(
                "URL model not trained. Run `python ml/train.py` from the project root."
            )
        _bundle = joblib.load(ARTIFACT_PATH)
    return _bundle


def get_model_metrics() -> dict:
    """Real holdout metrics from the last training run (not live-traffic
    numbers — production scans have no ground-truth label to score
    against). Used by /api/dashboard/stats for the DETECTION / FALSE POS
    figures."""
    bundle = get_bundle()
    model_type = bundle.get("model_type", "unknown")
    return bundle.get("metrics", {}).get(model_type, {})


def combine_verdicts(ml_probability: float, rule_verdict: str, high_confidence: float) -> str:
    ml_verdict = "PHISHING" if ml_probability >= 0.5 else "SAFE"

    if ml_verdict == "PHISHING" and rule_verdict == "PHISHING":
        combined = "PHISHING"
    elif ml_verdict == "SAFE" and rule_verdict == "SAFE":
        combined = "SAFE"
    else:
        combined = "SUSPICIOUS"

    if ml_probability > high_confidence and combined != "PHISHING":
        combined = "PHISHING"
    return combined


def score_url(url: str, check_live_signals: bool = True) -> dict:
    bundle = get_bundle()
    model = bundle["model"]
    feature_names = bundle["feature_names"]

    features = extract_features(url, check_live_signals=check_live_signals)
    feature_df = pd.DataFrame([features], columns=feature_names)

    ml_probability = float(model.predict_proba(feature_df)[0][1])
    shap_contributions = top_shap_contributions(model, feature_df)

    rule_result = evaluate_rules(features, _rules_config)
    verdict = combine_verdicts(
        ml_probability, rule_result["verdict"], _rules_config["thresholds"]["ml_high_confidence"]
    )

    return {
        "url": url,
        "verdict": verdict,
        "risk_score": round(ml_probability * 100, 2),
        "ml_probability": round(ml_probability, 4),
        "rule_score": rule_result["score"],
        "fired_rules": rule_result["fired_rules"],
        "shap_contributions": shap_contributions,
        "features": features,
        "model_type": bundle.get("model_type", "unknown"),
    }
