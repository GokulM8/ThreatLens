"""Re-exports the canonical feature extractor from backend.ml.features so the
training pipeline and the serving API share a single implementation."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.ml.features import FEATURE_NAMES, KNOWN_BROKER_DOMAINS, extract_features  # noqa: E402,F401
