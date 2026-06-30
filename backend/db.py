"""Shared Supabase client. Returns None when the URL/service key aren't
configured, so routers can fall back to local/offline behavior instead of
crashing at import time."""
import os

try:
    from supabase import create_client, Client
except ImportError:  # pragma: no cover
    create_client = None
    Client = None

_client = None
_checked = False


def get_supabase_client():
    global _client, _checked
    if _checked:
        return _client
    _checked = True

    # NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are the canonical
    # names going forward; SUPABASE_URL / SUPABASE_SERVICE_KEY are kept as a
    # fallback for any existing backend-only .env files.
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
    if create_client and url and key:
        _client = create_client(url, key)
    return _client
