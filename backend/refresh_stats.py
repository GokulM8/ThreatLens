"""Refreshes today's threat_stats row from current `scans` data, passing in
the URL model's real holdout accuracy (there's no ground truth on live
traffic to compute a "daily" accuracy from). Run after each retrain, or on
a daily schedule (cron/Supabase Edge Function) calling the same RPC:
    python -m backend.refresh_stats
"""
from .db import get_supabase_client
from .ml.model import ModelNotTrainedError, get_bundle


def main():
    client = get_supabase_client()
    if client is None:
        print("SUPABASE_URL/SUPABASE_SERVICE_KEY not set — nothing to refresh.")
        return

    try:
        bundle = get_bundle()
        accuracy = bundle["metrics"][bundle["model_type"]]["accuracy"]
    except ModelNotTrainedError:
        accuracy = None
        print("URL model not trained yet — refreshing threat_stats without an accuracy figure.")

    client.rpc("refresh_threat_stats", {"model_accuracy": accuracy}).execute()
    print("threat_stats refreshed for today" + (f" (accuracy={accuracy})" if accuracy else ""))


if __name__ == "__main__":
    main()
