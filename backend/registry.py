"""Communication authenticity registry.

Official SEBI/exchange communications are hashed at publication time and
stored in the `communications` Supabase table. /api/verify/communication
re-hashes whatever the user submits and checks for an exact match.

Falls back to a local JSON registry (data/communications_registry.json)
when Supabase credentials aren't configured, so the endpoint is fully
functional in offline/dev mode without external services.
"""
import hashlib
import json
import os
import re
from datetime import datetime, timezone

from .db import get_supabase_client
from .embeddings import embed_text

LOCAL_REGISTRY_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "data", "communications_registry.json"
)


def normalize_text(text: str) -> str:
    """Collapse incidental whitespace differences (copy-paste line breaks)
    while staying case- and punctuation-sensitive — a single altered word
    in an otherwise identical announcement must change the hash."""
    return re.sub(r"\s+", " ", text).strip()


def compute_hash(text: str) -> str:
    return hashlib.sha256(normalize_text(text).encode("utf-8")).hexdigest()


def _load_local_registry() -> list:
    if not os.path.exists(LOCAL_REGISTRY_PATH):
        return []
    with open(LOCAL_REGISTRY_PATH, "r") as f:
        return json.load(f)


def _lookup_local(content_hash: str) -> dict | None:
    for entry in _load_local_registry():
        if entry["hash"] == content_hash:
            return entry
    return None


def _lookup_supabase(client, content_hash: str) -> dict | None:
    resp = (
        client.table("communications")
        .select("*")
        .eq("hash", content_hash)
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    return rows[0] if rows else None


def _lookup_similar_supabase(client, text: str) -> dict | None:
    """Catches lightly-altered copies of a real notice that would dodge an
    exact hash match, via pgvector cosine similarity (match_communications
    SQL function, see supabase/schema.sql)."""
    embedding = embed_text(text)
    resp = client.rpc(
        "match_communications",
        {"query_embedding": embedding, "match_threshold": 0.92, "match_count": 1},
    ).execute()
    rows = resp.data or []
    return rows[0] if rows else None


def verify_communication(text: str) -> dict:
    content_hash = compute_hash(text)
    client = get_supabase_client()
    near_match = None

    if client is not None:
        try:
            match = _lookup_supabase(client, content_hash)
            lookup_method = "supabase"
            if not match:
                near_match = _lookup_similar_supabase(client, text)
        except Exception:
            match = _lookup_local(content_hash)
            lookup_method = "local_registry_fallback"
    else:
        match = _lookup_local(content_hash)
        lookup_method = "local_registry"

    if match:
        return {
            "verified": True,
            "exact_match": True,
            "hash": content_hash,
            "source": match.get("source"),
            "registered_at": match.get("timestamp") or match.get("registered_at"),
            "lookup_method": lookup_method,
        }
    if near_match:
        return {
            "verified": False,
            "exact_match": False,
            "hash": content_hash,
            "source": near_match.get("source"),
            "registered_at": None,
            "similarity": round(near_match.get("similarity", 0), 4),
            "lookup_method": lookup_method,
            "note": "Closely resembles a known communication but does not match exactly — "
            "treat as a possible altered/forged copy.",
        }
    return {
        "verified": False,
        "exact_match": False,
        "hash": content_hash,
        "source": None,
        "registered_at": None,
        "lookup_method": lookup_method,
    }


def register_communication(text: str, source: str) -> dict:
    """Adds a known-authentic communication to the registry. Writes to
    Supabase (with its embedding, for similarity search) when configured,
    otherwise appends to the local JSON file."""
    content_hash = compute_hash(text)
    timestamp = datetime.now(timezone.utc).isoformat()
    entry = {"hash": content_hash, "source": source, "timestamp": timestamp}

    client = get_supabase_client()
    if client is not None:
        client.table("communications").insert({
            "hash": content_hash,
            "source": source,
            "verified": True,
            "embedding": embed_text(text),
        }).execute()
        return entry

    registry = _load_local_registry()
    registry.append(entry)
    os.makedirs(os.path.dirname(LOCAL_REGISTRY_PATH), exist_ok=True)
    with open(LOCAL_REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=2)
    return entry
