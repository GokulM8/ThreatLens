"""SHAP-based explainability for the URL risk model.

Wraps shap.TreeExplainer (works for both RandomForest and XGBoost) and
returns the top-5 feature contributions toward the phishing class for a
single prediction.
"""
import numpy as np
import shap


def _positive_class_shap_values(shap_values) -> np.ndarray:
    """Normalizes across shap/sklearn version differences in TreeExplainer
    output shape for binary classifiers:
      - list of 2 arrays, each (n_samples, n_features)   [older shap + RF]
      - ndarray (n_samples, n_features, n_classes)        [newer shap + RF]
      - ndarray (n_samples, n_features)                   [XGBoost binary]
    Always returns (n_samples, n_features) for the positive (phishing) class.
    """
    if isinstance(shap_values, list):
        return np.asarray(shap_values[1])
    arr = np.asarray(shap_values)
    if arr.ndim == 3:
        return arr[:, :, 1]
    return arr


def top_shap_contributions(model, feature_df, top_n: int = 5) -> list:
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(feature_df)
    values = _positive_class_shap_values(shap_values)[0]

    contributions = [
        {
            "feature": feature_df.columns[i],
            "value": float(feature_df.iloc[0, i]),
            "shap_value": round(float(values[i]), 5),
        }
        for i in range(len(values))
    ]
    contributions.sort(key=lambda c: abs(c["shap_value"]), reverse=True)
    return contributions[:top_n]
