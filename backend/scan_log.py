"""Shared scan-logging helper used by every analyzer router so all four
analysis types (url, content, media, communication) land in one `scans`
table with a consistent shape for the dashboard to aggregate over."""
from datetime import datetime, timezone

from .db import get_supabase_client


def persist_scan(result: dict, scan_type: str, risk_score: float = None) -> None:
    client = get_supabase_client()
    if client is None:
        return
    try:
        client.table("scans").insert({
            "url": result.get("url", result.get("source") or f"<{scan_type}-submission>"),
            "risk_score": risk_score if risk_score is not None else result.get(
                "risk_score", result.get("synthetic_score", 0)
            ),
            "verdict": result["verdict"],
            "shap_json": result.get("shap_contributions") or [],
            "rules_triggered": result.get("fired_rules") or result.get("reasons") or [],
            "type": scan_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        pass
