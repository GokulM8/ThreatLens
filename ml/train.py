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

# The synthetic-augmentation functions below (path/query/subdomain variation)
# draw from Python's `random` module, which was previously unseeded — every
# retrain produced a different random sample of augmented legit URLs, so
# false-positive behavior on specific real-world URLs varied noticeably
# between runs (some fixed, others newly broke) even with no code change.
# Fixed seed makes iteration on the augmentation logic itself reproducible.
random.seed(42)
np.random.seed(42)

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


def _inject_unknown_domain_age(rows: list, fraction: float = 0.15) -> None:
    """Overwrites domain_age_proxy with the UNKNOWN_DOMAIN_AGE sentinel on a
    random sample of rows, in place. Called separately per class with the
    same fraction so the sentinel ends up class-neutral in the training
    data — without this, -1 never appears during training (only the
    label-correlated 400-6000 / 1-300 ranges do), so the model previously
    extrapolated it as "below the freshest phishing domain" i.e. maximally
    suspicious, rather than uninformative."""
    sample_size = round(len(rows) * fraction)
    for row in random.sample(rows, sample_size):
        row["domain_age_proxy"] = UNKNOWN_DOMAIN_AGE


def generate_synthetic_dataset(n_legit: int = 500, n_phishing: int = 500) -> pd.DataFrame:
    legit_rows = []
    for _ in range(n_legit):
        url, signals = _generate_legit_url()
        legit_rows.append({"url": url, "label": 0, **dict(zip(LIVE_SIGNAL_COLUMNS, signals))})
    phishing_rows = []
    for _ in range(n_phishing):
        url, signals = _generate_phishing_url()
        phishing_rows.append({"url": url, "label": 1, **dict(zip(LIVE_SIGNAL_COLUMNS, signals))})

    _inject_unknown_domain_age(legit_rows)
    _inject_unknown_domain_age(phishing_rows)

    rows = legit_rows + phishing_rows
    random.shuffle(rows)
    return pd.DataFrame(rows)


# PhiUSIIL's "legitimate" URLs are collected as bare root domains (literally
# 100% of them have zero path and zero query string — verified empirically),
# while its phishing URLs are live phishing-kit landing pages and almost
# always have one. That's a collection-methodology artifact, not a real
# phishing signal: real legitimate sites have login pages, dashboards,
# articles, search results, etc. constantly. Trained as-is, a model learns
# "any path at all -> phishing" and flags nearly every real-world URL
# (https://zerodha.com/login included). Augmenting a portion of the
# legitimate rows with realistic paths/queries breaks that spurious
# shortcut while keeping every other (real, useful) signal PhiUSIIL offers.
LEGIT_PATH_TEMPLATES = [
    "/login", "/account", "/dashboard", "/portfolio", "/profile/settings",
    "/about", "/about-us", "/contact", "/help", "/support/tickets",
    "/products", "/pricing", "/checkout", "/orders", "/search",
    "/blog/2024/market-update", "/news/article-456", "/docs/getting-started",
    "/api/v1/data", "/terms", "/privacy", "/careers", "/investor-relations",
]
LEGIT_QUERY_TEMPLATES = ["", "?ref=email", "?utm_source=newsletter", "?id=4821", "?page=2", "?q=results"]

QUERY_WORDS = [
    "how", "to", "make", "demo", "video", "for", "project", "using", "ai",
    "best", "guide", "tutorial", "review", "compare", "price", "near", "me",
    "what", "is", "the", "top", "free", "online", "course", "tips", "setup",
]


SLUG_WORDS = [
    "report", "update", "summary", "details", "overview", "guide", "review",
    "alert", "notice", "policy", "plan", "account", "session", "request",
    "form", "page", "item", "post", "entry", "record",
]


PATH_SEGMENT_WORDS = [
    "user", "users", "item", "post", "video", "product", "products", "repo",
    "doc", "docs", "file", "files", "thread", "status", "playlist", "article",
    "articles", "channel", "profile", "comments", "r", "in", "watch", "view",
    "edit", "browse", "feed", "library", "collection", "category", "topic",
]


FILE_EXTENSIONS = ["html", "htm", "pdf", "jpg", "png", "json", "xml", "php", "aspx", "doc", "docx", "csv", "mp4", "gif"]


def _maybe_add_extension(path: str) -> str:
    """0% of legit training rows had a dot anywhere in the path, vs 12% of
    phishing rows — none of the path generation below ever produced a file
    extension (.html, .pdf, ...), even though file-serving URLs (a news
    article ending /ai-news.html, a downloaded /document.pdf) are everyday
    legitimate traffic. A path dot reads as an "extra" dot beyond the
    domain's own, which fed dot_count's outsized SHAP weight on real news
    articles and file links. Skip fragments/bare-"/" — an extension there
    isn't realistic."""
    if path in ("/",) or "#" in path or random.random() >= 0.25:
        return path
    return f"{path}.{random.choice(FILE_EXTENSIONS)}"


def _random_legit_path() -> str:
    """Real content/profile/document URLs (GitHub repos, Reddit threads,
    Stack Overflow questions, Amazon products, Spotify playlists, Google
    Docs, Twitter posts...) overwhelmingly look like
    /segment/segment/long-id or /segment/long-descriptive-slug — multiple
    path segments, often with a long alphanumeric ID or a long hyphenated
    slug. A fixed list of ~20 short single/double-segment templates (the
    original version of this function) doesn't represent that shape at all.

    Measured on a 36-URL sample of ordinary real sites (YouTube, Gmail,
    GitHub, Wikipedia, Amazon, Twitter, Reddit, Stack Overflow, NYTimes,
    Spotify, Zoom, Dropbox, Google Docs/Drive...), the model trained on the
    narrower version of this function flagged 15/36 (42%) as phishing —
    every single one with a multi-segment path containing an ID or slug.
    That's a systemic gap, not one more one-off case to patch: deep,
    ID-bearing paths needed to become a *common* case in the legitimate
    class, not a rare one alongside the bare "/" and short-template cases.
    """
    style = random.random()

    if style < 0.10:
        result = "/"
    elif style < 0.30:
        result = random.choice(LEGIT_PATH_TEMPLATES)
    elif style < 0.45:
        base = random.choice(LEGIT_PATH_TEMPLATES)
        result = f"{base}/{random.choice(SLUG_WORDS)}-{random.randint(100, 99999)}"
    elif style < 0.75:
        # Deep multi-segment path with a long ID — github.com/org/repo,
        # reddit.com/r/sub/comments/<id>/<slug>/, amazon.com/dp/<id>.
        segment_count = random.randint(2, 4)
        segments = []
        for _ in range(segment_count):
            kind = random.random()
            if kind < 0.45:
                segments.append(random.choice(PATH_SEGMENT_WORDS))
            elif kind < 0.75:
                segments.append(_random_string(random.randint(6, 24)))
            else:
                segments.append(str(random.randint(1000, 999999999)))
        result = "/" + "/".join(segments)
    elif style < 0.95:
        # Long descriptive slug — a blog post, news article, or SO question
        # title, routinely 4-9 hyphenated words.
        words = random.sample(QUERY_WORDS + SLUG_WORDS, random.randint(4, 9))
        section = random.choice(["blog", "article", "articles", "news", "docs", "questions", "wiki"])
        result = f"/{section}/" + "-".join(words)
    else:
        # Fragment-only or path+fragment — gmail.com/mail/u/0/#inbox.
        base = random.choice(LEGIT_PATH_TEMPLATES)
        result = f"{base}#" + random.choice(["inbox", "section", "top", "details", "comments"])

    return _maybe_add_extension(result)


def _random_legit_query() -> str:
    """The fixed LEGIT_QUERY_TEMPLATES above max out around 23 chars — real
    search-engine and ad-tracking query strings routinely run 50-100+ chars
    with a dozen+ special characters (multi-word searches joined by '+',
    multi-parameter UTM/click-tracking joined by '&'), e.g. a YouTube
    search query. None of that length/complexity was ever in the legit
    training class, so query_length and special_char_count were just as
    under-augmented as path_length originally was — a normal multi-word
    search link would still read as "phishing-shaped". Compose realistic
    long queries procedurally instead of relying on the short fixed list."""
    style = random.random()
    if style < 0.25:
        return ""
    if style < 0.5:
        # Short, single-param queries (?dl=0, ?v=2, ?tab=1, ?pwd=Ab3xZ9) —
        # the gap this branch closes: measured empirically, the three
        # branches below produced query_length either 0 or 30+ with a
        # complete 0% hole at 11-20 chars and thin 1-10 coverage. Real short
        # params (a Dropbox "?dl=0", a Zoom "?pwd=...") landed right in that
        # gap and read as strongly phishing-shaped on length alone.
        key = random.choice(["dl", "v", "tab", "ref", "lang", "sort", "view", "mode", "pwd", "src"])
        value = random.choice([str(random.randint(0, 99)), _random_string(random.randint(2, 10))])
        return f"?{key}={value}"
    if style < 0.7:
        words = random.sample(QUERY_WORDS, random.randint(3, 8))
        return "?search_query=" + "+".join(words)
    if style < 0.9:
        params = {
            "utm_source": random.choice(["google", "newsletter", "facebook", "twitter"]),
            "utm_medium": random.choice(["cpc", "email", "social", "organic"]),
            "utm_campaign": _random_string(10),
            "gclid": _random_string(20),
        }
        chosen = dict(random.sample(list(params.items()), random.randint(2, len(params))))
        return "?" + "&".join(f"{k}={v}" for k, v in chosen.items())
    return random.choice(LEGIT_QUERY_TEMPLATES)


def _augment_legit_paths(df: pd.DataFrame, fraction: float = 0.85) -> pd.DataFrame:
    legit_idx = df.index[df["label"] == 0]
    sample = random.sample(list(legit_idx), round(len(legit_idx) * fraction))
    for idx in sample:
        path = _random_legit_path()
        query = _random_legit_query()
        df.at[idx, "url"] = df.at[idx, "url"].rstrip("/") + path + query
    return df


# Every single legitimate URL in PhiUSIIL is "www."-prefixed (100% of
# 134,850 rows, verified empirically) vs. ~41% of its phishing URLs — another
# pure collection artifact (real legitimate sites are used bare-domain
# constantly: zerodha.com, gmail.com, etc.) that teaches "no www. -> phishing"
# as a near-perfect-but-spurious shortcut. Stripping www. from a portion of
# legit rows (independently of the path augmentation above) breaks it.
def _vary_legit_subdomains(df: pd.DataFrame, fraction: float = 0.5) -> pd.DataFrame:
    legit_idx = df.index[df["label"] == 0]
    sample = random.sample(list(legit_idx), round(len(legit_idx) * fraction))
    for idx in sample:
        df.at[idx, "url"] = df.at[idx, "url"].replace("://www.", "://", 1)
    return df


# The 17 KNOWN_BROKER_DOMAINS never appear in a 235K-row generic global
# dataset like PhiUSIIL, so alexa_rank_proxy's special low-value sentinel,
# lexical_similarity_to_known_brokers=1.0, and lookalike_score=1.0 have never
# been seen in a *legitimate* context during training — only ever inferred
# indirectly. That's what made alexa_rank_proxy=0.05 read as suspicious for
# zerodha.com (SHAP +4.0): the model had zero real examples of what those
# broker-specific feature values mean when the row actually is legitimate.
def _known_broker_examples() -> pd.DataFrame:
    rows = []
    for domain in KNOWN_BROKER_DOMAINS:
        for _ in range(20):
            sub = random.choice(["", "www."])
            path = random.choice(["", _random_legit_path()])
            query = _random_legit_query()
            url = f"https://{sub}{domain}{path}{query}"
            rows.append({"url": url, "label": 0})
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
        df = _augment_legit_paths(df)
        df = _vary_legit_subdomains(df)
        df = pd.concat([df, _known_broker_examples()], ignore_index=True)
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
