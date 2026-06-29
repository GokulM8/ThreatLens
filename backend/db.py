"""Shared Supabase client. Returns None when SUPABASE_URL/SUPABASE_SERVICE_KEY
aren't configured, so routers can fall back to local/offline behavior."""
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

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if create_client and url and key:
        _client = create_client(url, key)
    return _client
