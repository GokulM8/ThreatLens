"""NLP phishing/scam text detection: TF-IDF + Logistic Regression, overlaid
with a YAML-configured keyword/phrase heuristic (content_keywords.yaml).
"""
import os
import scipy.sparse as sp
import joblib
import yaml

ARTIFACT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "artifacts", "text_model.pkl"
)
KEYWORDS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "content_keywords.yaml")

_bundle = None
_keywords_config = None


class TextModelNotTrainedError(RuntimeError):
    pass


def get_bundle() -> dict:
    global _bundle
    if _bundle is None:
        if not os.path.exists(ARTIFACT_PATH):
            raise TextModelNotTrainedError(
                "Text model not trained. Run `python ml/train_text.py` from the project root."
            )
        _bundle = joblib.load(ARTIFACT_PATH)
    return _bundle


def get_keywords_config() -> dict:
    global _keywords_config
    if _keywords_config is None:
        with open(KEYWORDS_PATH, "r") as f:
            _keywords_config = yaml.safe_load(f)
    return _keywords_config


def score_keywords(text: str) -> dict:
    config = get_keywords_config()
    text_lower = text.lower()
    fired = []
    total = 0
    for group in config["keyword_groups"]:
        matched_phrases = [p for p in group["phrases"] if p in text_lower]
        if matched_phrases:
            total += group["score"]
            fired.append({
                "name": group["name"],
                "score": group["score"],
                "matched_phrases": matched_phrases,
            })

    thresholds = config["thresholds"]
    if total >= thresholds["phishing_score"]:
        verdict = "PHISHING"
    elif total >= thresholds["suspicious_score"]:
        verdict = "SUSPICIOUS"
    else:
        verdict = "SAFE"

    return {"score": total, "verdict": verdict, "fired_rules": fired}


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


def analyze_text(text: str) -> dict:
    bundle = get_bundle()
    model = bundle["model"]

    if "word_vectorizer" in bundle:
        W = bundle["word_vectorizer"].transform([text])
        C = bundle["char_vectorizer"].transform([text])
        X = sp.hstack([W, C])
    else:
        X = bundle["vectorizer"].transform([text])
    ml_probability = float(model.predict_proba(X)[0][1])

    keyword_result = score_keywords(text)
    config = get_keywords_config()
    verdict = combine_verdicts(
        ml_probability, keyword_result["verdict"], config["thresholds"]["ml_high_confidence"]
    )

    return {
        "verdict": verdict,
        "risk_score": round(ml_probability * 100, 2),
        "ml_probability": round(ml_probability, 4),
        "keyword_score": keyword_result["score"],
        "fired_rules": keyword_result["fired_rules"],
    }
