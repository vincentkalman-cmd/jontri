#!/usr/bin/env python3
"""Schedule the prospecting agent to run on a recurring basis."""

import schedule
import time
from main import run_prospecting


def job():
    """Run the prospecting pipeline."""
    print("\n--- Scheduled run starting ---")
    run_prospecting(
        max_pages=2,
        min_score=6,
        send_emails=True,
        dry_run=True,  # Change to False when ready for live emails
    )
    print("--- Scheduled run complete ---\n")


if __name__ == "__main__":
    # Run every weekday at 9 AM
    schedule.every().monday.at("09:00").do(job)
    schedule.every().tuesday.at("09:00").do(job)
    schedule.every().wednesday.at("09:00").do(job)
    schedule.every().thursday.at("09:00").do(job)
    schedule.every().friday.at("09:00").do(job)

    print("Prospector scheduler started. Running weekdays at 9:00 AM.")
    print("Press Ctrl+C to stop.\n")

    # Run once immediately on start
    job()

    while True:
        schedule.run_pending()
        time.sleep(60)
