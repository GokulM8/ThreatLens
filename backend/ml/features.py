"""URL structural feature extraction for the ThreatLens phishing model.

24 features combining lexical/structural signals (urllib.parse, pure-python
entropy/edit-distance) with live network-derived signals (redirect_count,
domain_age_proxy, external_resources_count, form_action_external) that
degrade gracefully to sentinel/neutral values when no network access is
available (offline dev, sandboxed CI, rate-limited WHOIS, etc.).
"""
import math
from datetime import datetime, timezone
from urllib.parse import urlparse

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None

try:
    from bs4 import BeautifulSoup
except ImportError:  # pragma: no cover
    BeautifulSoup = None

try:
    import whois as whois_lib
except ImportError:  # pragma: no cover
    whois_lib = None

KNOWN_BROKER_DOMAINS = [
    "zerodha.com", "groww.in", "upstox.com", "angelone.in", "icicidirect.com",
    "hdfcsec.com", "kotaksecurities.com", "sharekhan.com", "motilaloswal.com",
    "sebi.gov.in", "nseindia.com", "bseindia.com", "paytmmoney.com",
    "5paisa.com", "edelweiss.in", "indmoney.com", "axisdirect.in",
]

BRAND_KEYWORDS = [
    "zerodha", "groww", "upstox", "angelone", "icicidirect", "hdfcsec",
    "kotaksecurities", "sharekhan", "motilaloswal", "sebi", "nse", "bse",
    "paytmmoney", "5paisa", "edelweiss", "indmoney", "axisdirect",
]

SUSPICIOUS_TLDS = [
    "tk", "ml", "ga", "cf", "gq", "xyz", "top", "club", "work", "click",
    "loan", "online", "site", "info", "link", "win", "review", "kim",
    "gdn", "mom", "men", "cricket", "science", "party",
]

SHORTENING_SERVICES = [
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly",
    "adf.ly", "shorte.st", "bit.do", "cutt.ly", "rb.gy", "tiny.cc",
    "rebrand.ly", "clck.ru", "shorturl.at",
]

# Homoglyph normalization for the lookalike-score check: maps characters
# commonly substituted in visual-spoofing domains (z3rodha, gr0ww, upst0x)
# back to the letter they're impersonating before comparing to known brands.
HOMOGLYPH_MAP = str.maketrans({
    "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b",
})

FEATURE_NAMES = [
    "url_length", "subdomain_depth", "special_char_count", "https_present",
    "domain_entropy", "lexical_similarity_to_known_brokers", "redirect_count",
    "digit_ratio", "dot_count", "hyphen_count", "at_count", "tld_suspicious",
    "path_length", "query_length", "fragment_present", "ip_in_url",
    "shortening_service", "domain_age_proxy", "alexa_rank_proxy",
    "brand_keyword_present", "lookalike_score", "punycode_present",
    "external_resources_count", "form_action_external",
]

# Sentinel used when a live network signal could not be resolved.
UNKNOWN_DOMAIN_AGE = -1


def _is_ip_host(hostname: str) -> bool:
    if not hostname:
        return False
    parts = hostname.split(".")
    if len(parts) != 4:
        return False
    for part in parts:
        if not part.isdigit() or not 0 <= int(part) <= 255:
            return False
    return True


def _shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    freq = {}
    for ch in s:
        freq[ch] = freq.get(ch, 0) + 1
    length = len(s)
    return -sum((c / length) * math.log2(c / length) for c in freq.values())


def _edit_distance(a: str, b: str) -> int:
    if a == b:
        return 0
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        curr = [i] + [0] * len(b)
        for j, cb in enumerate(b, start=1):
            cost = 0 if ca == cb else 1
            curr[j] = min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
        prev = curr
    return prev[-1]


def _best_similarity(candidate: str, pool: list) -> float:
    if not candidate:
        return 0.0
    best = 0.0
    for known in pool:
        dist = _edit_distance(candidate, known)
        similarity = 1 - dist / max(len(candidate), len(known))
        best = max(best, similarity)
    return round(best, 4)


def _lexical_similarity_to_known_brokers(hostname: str) -> float:
    """Raw edit-distance similarity — catches single-character typos
    (zerodhaa.com vs zerodha.com)."""
    return _best_similarity(hostname, KNOWN_BROKER_DOMAINS)


def _lookalike_score(hostname: str) -> float:
    """Edit-distance similarity *after* normalizing common homoglyph
    substitutions (z3rodha -> zerodha) — catches visual-spoofing that
    plain edit distance scores lower because the character count matches
    but the literal characters don't."""
    normalized = hostname.translate(HOMOGLYPH_MAP)
    return _best_similarity(normalized, KNOWN_BROKER_DOMAINS)


def _tld_suspicious(hostname: str) -> bool:
    if not hostname:
        return False
    tld = hostname.rsplit(".", 1)[-1].lower()
    return tld in SUSPICIOUS_TLDS


def _shortening_service(hostname: str) -> bool:
    return hostname.lower() in SHORTENING_SERVICES


def _punycode_present(hostname: str) -> bool:
    return "xn--" in hostname.lower()


def _brand_keyword_present(url: str, hostname: str) -> bool:
    """A brand name appearing in the URL without the hostname actually
    *being* that brand's domain is a classic impersonation/keyword-stuffing
    signal (e.g. zerodha-kyc-update.tk)."""
    url_lower = url.lower()
    is_real_broker_domain = hostname.lower() in KNOWN_BROKER_DOMAINS
    if is_real_broker_domain:
        return False
    return any(keyword in url_lower for keyword in BRAND_KEYWORDS)


def _alexa_rank_proxy(hostname: str, domain_entropy: float) -> float:
    """The real Alexa Rank API has been discontinued, so this is a
    deterministic, offline structural proxy for "how well-established does
    this domain look": known brokers score low/good (0.05), everything else
    is scored by domain length + entropy, both of which trend higher for
    throwaway/freshly-registered phishing domains. Normalized 0 (looks
    established) - 1 (looks obscure/unranked)."""
    if not hostname:
        return 1.0
    if hostname.lower() in KNOWN_BROKER_DOMAINS:
        return 0.05
    length_component = min(len(hostname) / 40, 1.0)
    entropy_component = min(domain_entropy / 4.5, 1.0)
    return round(min(0.5 * length_component + 0.5 * entropy_component + 0.3, 1.0), 4)


def _redirect_count_from_response(response) -> int:
    return len(response.history) if response is not None else 0


def _fetch_page(url: str, timeout: float = 3.0):
    """Single live fetch reused for redirect_count, external_resources_count,
    and form_action_external, instead of three separate requests."""
    if requests is None:
        return None
    try:
        return requests.get(url, allow_redirects=True, timeout=timeout)
    except Exception:
        return None


def _html_resource_signals(response, hostname: str) -> dict:
    if response is None or BeautifulSoup is None or not response.headers.get(
        "Content-Type", ""
    ).startswith("text/html"):
        return {"external_resources_count": 0, "form_action_external": 0}

    try:
        soup = BeautifulSoup(response.text, "html.parser")
    except Exception:
        return {"external_resources_count": 0, "form_action_external": 0}

    def is_external(link: str) -> bool:
        if not link or link.startswith(("#", "javascript:", "data:", "mailto:")):
            return False
        parsed = urlparse(link)
        return bool(parsed.hostname) and parsed.hostname != hostname

    external_resources = 0
    for tag, attr in (("script", "src"), ("img", "src"), ("link", "href")):
        for el in soup.find_all(tag):
            if is_external(el.get(attr, "")):
                external_resources += 1

    form_action_external = 0
    for form in soup.find_all("form"):
        if is_external(form.get("action", "")):
            form_action_external = 1
            break

    return {
        "external_resources_count": external_resources,
        "form_action_external": form_action_external,
    }


def _domain_age_proxy(hostname: str) -> int:
    if whois_lib is None or not hostname:
        return UNKNOWN_DOMAIN_AGE
    try:
        record = whois_lib.whois(hostname)
        creation = record.creation_date
        if isinstance(creation, list):
            creation = creation[0] if creation else None
        if creation is None:
            return UNKNOWN_DOMAIN_AGE
        if creation.tzinfo is None:
            creation = creation.replace(tzinfo=timezone.utc)
        return max((datetime.now(timezone.utc) - creation).days, 0)
    except Exception:
        return UNKNOWN_DOMAIN_AGE


def extract_features(url: str, check_live_signals: bool = True) -> dict:
    """Extract the 24 structural features for a URL.

    check_live_signals controls whether the network-bound redirect_count,
    domain_age_proxy, external_resources_count, and form_action_external are
    actually resolved (set False for bulk/offline scoring to avoid per-URL
    network round trips).
    """
    parsed = urlparse(url if "://" in url else f"http://{url}")
    hostname = parsed.hostname or ""
    path = parsed.path or ""
    query = parsed.query or ""

    domain_parts = hostname.split(".") if hostname else []
    subdomain_depth = max(len(domain_parts) - 2, 0) if len(domain_parts) > 2 else 0
    special_chars = sum(1 for ch in url if not ch.isalnum() and ch not in "/:.")
    domain_entropy = round(_shannon_entropy(hostname), 4)

    if check_live_signals:
        response = _fetch_page(url)
        redirect_count = _redirect_count_from_response(response)
        resource_signals = _html_resource_signals(response, hostname)
        domain_age_proxy = _domain_age_proxy(hostname)
    else:
        redirect_count = 0
        resource_signals = {"external_resources_count": 0, "form_action_external": 0}
        domain_age_proxy = UNKNOWN_DOMAIN_AGE

    features = {
        "url_length": len(url),
        "subdomain_depth": subdomain_depth,
        "special_char_count": special_chars,
        "https_present": 1 if parsed.scheme == "https" else 0,
        "domain_entropy": domain_entropy,
        "lexical_similarity_to_known_brokers": _lexical_similarity_to_known_brokers(hostname),
        "redirect_count": redirect_count,
        "digit_ratio": round(
            sum(ch.isdigit() for ch in hostname) / len(hostname), 4
        ) if hostname else 0.0,
        "dot_count": url.count("."),
        "hyphen_count": url.count("-"),
        "at_count": url.count("@"),
        "tld_suspicious": 1 if _tld_suspicious(hostname) else 0,
        "path_length": len(path),
        "query_length": len(query),
        "fragment_present": 1 if parsed.fragment else 0,
        "ip_in_url": 1 if _is_ip_host(hostname) else 0,
        "shortening_service": 1 if _shortening_service(hostname) else 0,
        "domain_age_proxy": domain_age_proxy,
        "alexa_rank_proxy": _alexa_rank_proxy(hostname, domain_entropy),
        "brand_keyword_present": 1 if _brand_keyword_present(url, hostname) else 0,
        "lookalike_score": _lookalike_score(hostname),
        "punycode_present": 1 if _punycode_present(hostname) else 0,
        "external_resources_count": resource_signals["external_resources_count"],
        "form_action_external": resource_signals["form_action_external"],
    }
    return features
