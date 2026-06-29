"""Seeds the local communications registry with a few demo official
notices so /api/verify/communication has something to match against in
offline/dev mode (no Supabase configured). Run with:
    python -m backend.seed_registry
"""
from . import registry

SAMPLE_COMMUNICATIONS = [
    (
        "SEBI advises investors to deal only with SEBI registered intermediaries for "
        "securities market related transactions. Investors are cautioned against "
        "unregistered entities offering guaranteed or assured returns on investments "
        "in securities markets.",
        "SEBI Investor Advisory",
    ),
    (
        "NSE Circular: In view of the upcoming Diwali holiday, trading hours on the "
        "Capital Market, Futures & Options, and Currency Derivatives segments will "
        "remain unchanged. A special Muhurat trading session will be conducted as "
        "per the schedule notified separately.",
        "NSE Circular",
    ),
    (
        "BSE Notice: Members are informed that the annual system audit for FY25 has "
        "been completed and the report has been submitted to SEBI as per the "
        "applicable cyber security and cyber resilience framework.",
        "BSE Notice",
    ),
]


def main():
    for text, source in SAMPLE_COMMUNICATIONS:
        entry = registry.register_communication(text, source)
        print(f"Registered [{source}] -> {entry['hash']}")


if __name__ == "__main__":
    main()
