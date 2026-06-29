"""Fixed-size (384-dim) text embeddings for pgvector similarity search.

Uses scikit-learn's HashingVectorizer rather than a downloaded transformer
model — it's deterministic, has zero network/model-download dependency, and
produces a fixed-size dense vector, which is exactly what's needed to catch
near-duplicate scam text that copies most of a real notice (exact SHA-256
hashing alone would miss that).
"""
from sklearn.feature_extraction.text import HashingVectorizer

EMBEDDING_DIM = 384

_vectorizer = HashingVectorizer(
    n_features=EMBEDDING_DIM, norm="l2", alternate_sign=False, ngram_range=(1, 2)
)


def embed_text(text: str) -> list[float]:
    vector = _vectorizer.transform([text])
    return vector.toarray()[0].tolist()
