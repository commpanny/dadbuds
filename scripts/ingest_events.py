from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest Spokane events into DadBuds cache.")
    parser.add_argument(
        "--lookahead-days",
        type=int,
        default=int(os.getenv("INGEST_LOOKAHEAD_DAYS", "90")),
        help="How many days ahead to fetch from SeatGeek.",
    )
    args = parser.parse_args()

    for env_name in (".env.local", ".env"):
        load_env_file(ROOT / env_name)

    from backend.app.seatgeek_ingest import (
        ingest_seatgeek_events,
        seatgeek_client_id,
        write_ingest_cache,
    )

    client_id = seatgeek_client_id()
    if not client_id:
        print("Missing SEATGEEK_CLIENT_ID. Add it to .env.local and retry.")
        return 1

    events, summary = ingest_seatgeek_events(
        client_id=client_id,
        lookahead_days=args.lookahead_days,
    )
    cache_path = write_ingest_cache(events)

    print(f"SeatGeek fetched: {summary.fetched}")
    print(f"Kept for DadBuds: {summary.kept}")
    print(f"Skipped past events: {summary.skipped_past}")
    print(f"Skipped missing datetime: {summary.skipped_missing_datetime}")
    print(f"Wrote cache: {cache_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
