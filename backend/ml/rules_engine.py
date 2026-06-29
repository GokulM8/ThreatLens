"""Generic YAML-driven heuristic rule evaluator.

Loads backend/ml/rules.yaml and scores any feature dict against it. A rule
is skipped (not evaluated) if the feature's value equals that rule's
declared `unknown_value` sentinel — this keeps "unresolvable" signals like
domain_age_days (no WHOIS access) from being misread as a positive signal.
"""
import os
import operator as op
import yaml

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rules.yaml")

OPERATORS = {
    ">": op.gt, ">=": op.ge, "<": op.lt, "<=": op.le, "==": op.eq, "!=": op.ne,
}


def load_rules(config_path: str = CONFIG_PATH) -> dict:
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def evaluate_rules(features: dict, config: dict = None) -> dict:
    if config is None:
        config = load_rules()

    thresholds = config["thresholds"]
    fired_rules = []
    total_score = 0

    for rule in config["rules"]:
        value = features.get(rule["feature"])
        if value is None:
            continue
        if "unknown_value" in rule and value == rule["unknown_value"]:
            continue
        comparator = OPERATORS[rule["operator"]]
        if comparator(value, rule["value"]):
            total_score += rule["score"]
            fired_rules.append({
                "name": rule["name"],
                "description": rule["description"],
                "score": rule["score"],
            })

    if total_score >= thresholds["phishing_score"]:
        verdict = "PHISHING"
    elif total_score >= thresholds["suspicious_score"]:
        verdict = "SUSPICIOUS"
    else:
        verdict = "SAFE"

    return {"score": total_score, "verdict": verdict, "fired_rules": fired_rules}
