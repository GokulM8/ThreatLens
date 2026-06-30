import hashlib
from collections import defaultdict

from fastapi import APIRouter

from ..db import get_supabase_client
from ..ml.model import ModelNotTrainedError, get_model_metrics

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

EMPTY_STATS = {
    "aggregate_risk_score": 0.0,
    "total_scans": 0,
    "scans_count": 0,
    "exchanges_count": 0,
    "phishing_count": 0,
    "deepfake_count": 0,
    "all_threats_pct": 0.0,
    "detection_rate": 0.0,
    "false_positive_rate": 0.0,
    "timeline": [],
    "active_threats": [],
    "scan_history": [],
}

THREAT_VERDICTS = {"PHISHING", "SUSPICIOUS", "SYNTHETIC_SUSPECTED", "INCONCLUSIVE"}

# Short display label per scan type, used for the Active Threats panel avatars
TYPE_LABEL = {"url": "phishing", "content": "scam text", "media": "deepfake", "communication": "lookalike"}


def _short_hash(value: str) -> str:
    return hashlib.sha256((value or "").encode("utf-8")).hexdigest()[:10]


def _risk_label(verdict: str) -> str:
    if verdict in ("PHISHING", "SYNTHETIC_SUSPECTED"):
        return "High risk"
    if verdict in ("SUSPICIOUS", "INCONCLUSIVE"):
        return "Medium"
    return "Safe"


def _model_metrics_safe() -> dict:
    try:
        return get_model_metrics()
    except ModelNotTrainedError:
        return {}


def _build_timeline(scans: list, days: int) -> list:
    """Groups already-fetched scans by UTC day (the timestamp's date
    portion). Derived live from `scans` rather than the `threat_stats`
    table, since that table is only ever populated by a separate
    refresh_threat_stats() call (a daily cron/Edge Function per
    supabase/schema.sql) — without anyone actually running that job, the
    timeline would always come back empty even with real scan data."""
    buckets: dict = defaultdict(lambda: {"phishing_count": 0, "deepfake_count": 0, "total_scans": 0})
    for s in scans:
        timestamp = s.get("timestamp")
        if not timestamp:
            continue
        day = timestamp[:10]
        bucket = buckets[day]
        bucket["total_scans"] += 1
        if s.get("verdict") == "PHISHING":
            bucket["phishing_count"] += 1
        if s.get("type") == "media" and s.get("verdict") == "SYNTHETIC_SUSPECTED":
            bucket["deepfake_count"] += 1

    return [{"date": day, **buckets[day]} for day in sorted(buckets)[-days:]]


@router.get("/stats")
def dashboard_stats(scan_limit: int = 200, timeline_days: int = 7):
    model_metrics = _model_metrics_safe()
    model_derived_stats = {
        "detection_rate": round(model_metrics.get("detection_rate", 0) * 100, 1),
        "false_positive_rate": round(model_metrics.get("false_positive_rate", 0) * 100, 1),
    }

    client = get_supabase_client()
    if client is None:
        return {**EMPTY_STATS, **model_derived_stats}

    try:
        scans_resp = (
            client.table("scans")
            .select("*")
            .order("timestamp", desc=True)
            .limit(scan_limit)
            .execute()
        )
        scans = scans_resp.data or []

        communications_resp = client.table("communications").select("source").execute()
        exchanges_count = len({row["source"] for row in (communications_resp.data or [])})
    except Exception:
        return {**EMPTY_STATS, **model_derived_stats}

    total_scans = len(scans)
    scans_count = sum(1 for s in scans if s.get("type") in ("url", "content", "media"))
    phishing_count = sum(1 for s in scans if s.get("verdict") == "PHISHING")
    deepfake_count = sum(
        1 for s in scans if s.get("type") == "media" and s.get("verdict") == "SYNTHETIC_SUSPECTED"
    )
    threat_count = sum(1 for s in scans if s.get("verdict") in THREAT_VERDICTS)
    all_threats_pct = round((threat_count / total_scans) * 100, 1) if total_scans else 0.0

    risk_scores = [s["risk_score"] for s in scans if s.get("risk_score") is not None]
    aggregate_risk_score = round(sum(risk_scores) / len(risk_scores), 1) if risk_scores else 0.0

    active_threats = [
        {
            "id": s.get("id"),
            "label": (s.get("url") or "unknown")[:2].upper(),
            "subtext": s.get("url"),
            "threat_type": TYPE_LABEL.get(s.get("type"), s.get("type")),
            "verdict": s.get("verdict"),
        }
        for s in scans
        if s.get("verdict") in THREAT_VERDICTS
    ][:3]

    scan_history = [
        {
            "id": s.get("id"),
            "risk_score": s.get("risk_score"),
            "verdict": s.get("verdict"),
            "risk_label": _risk_label(s.get("verdict")),
            "hash": _short_hash(s.get("url", "")),
            "url": s.get("url"),
            "timestamp": s.get("timestamp"),
        }
        for s in scans[:6]
    ]

    return {
        "aggregate_risk_score": aggregate_risk_score,
        "total_scans": total_scans,
        "scans_count": scans_count,
        "exchanges_count": exchanges_count,
        "phishing_count": phishing_count,
        "deepfake_count": deepfake_count,
        "all_threats_pct": all_threats_pct,
        **model_derived_stats,
        "timeline": _build_timeline(scans, timeline_days),
        "active_threats": active_threats,
        "scan_history": scan_history,
    }
