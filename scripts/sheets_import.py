#!/usr/bin/env python3
"""
Google Sheets Import for TSE Hub — Account Task Lists

Imports rows from a Google Sheet into an account's tasks.md file.
Preserves locally-added tasks that don't originate from the sheet.

Setup (one-time):
    1. Create a Google Cloud project and enable the Sheets API
    2. Create a service account and download the JSON key file
    3. Set GOOGLE_SERVICE_ACCOUNT_KEY in ../.env to the path of that JSON key
    4. Share each Google Sheet with the service account email (read-only is fine)

Usage:
    python sheets_import.py acme-corp                # Import for one account
    python sheets_import.py --all                    # Import for all accounts with a sheet configured
    python sheets_import.py acme-corp --dry-run      # Preview without writing

Column Mapping:
    The script expects columns in this order (configurable via --columns):
      A: Task description
      B: Source (e.g. "QBR March 2026", "Slack")
      C: Due date (YYYY-MM-DD or human-readable)
      D: Status ("done" / "complete" / "x" marks it complete; anything else is open)

    Override with: --columns "description,source,due,status"
    The first row is treated as a header and skipped.
"""

import json
import sys
import re
import argparse
from pathlib import Path
from datetime import datetime

SCRIPTS_DIR = Path(__file__).resolve().parent
ROOT = SCRIPTS_DIR.parent
ACCOUNTS_DIR = ROOT / "accounts"

DEFAULT_COLUMNS = ["description", "source", "due", "status"]


def load_env() -> dict:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return {}
    env = {}
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def get_sheets_service():
    """Build a Google Sheets API service using a service account key."""
    try:
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build
    except ImportError:
        print("Error: google-api-python-client and google-auth are required.")
        print("Install with: pip install google-api-python-client google-auth")
        sys.exit(1)

    env = load_env()
    key_path = env.get("GOOGLE_SERVICE_ACCOUNT_KEY", "")
    if not key_path:
        print("Error: GOOGLE_SERVICE_ACCOUNT_KEY not set in .env")
        print("Set it to the path of your Google service account JSON key file.")
        sys.exit(1)

    key_path = Path(key_path)
    if not key_path.is_absolute():
        key_path = ROOT / key_path
    if not key_path.exists():
        print(f"Error: Service account key not found at {key_path}")
        sys.exit(1)

    creds = Credentials.from_service_account_file(
        str(key_path), scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
    )
    return build("sheets", "v4", credentials=creds)


def read_account_meta(account_dir: Path) -> dict:
    meta_path = account_dir / "meta.json"
    if not meta_path.exists():
        return {}
    try:
        return json.loads(meta_path.read_text())
    except Exception:
        return {}


def fetch_sheet_rows(service, sheet_id: str, range_name: str = "A:D") -> list[list[str]]:
    """Fetch rows from a Google Sheet."""
    result = service.spreadsheets().values().get(
        spreadsheetId=sheet_id, range=range_name
    ).execute()
    return result.get("values", [])


def parse_rows(rows: list[list[str]], columns: list[str]) -> list[dict]:
    """Parse sheet rows into structured task dicts, skipping the header row."""
    if not rows or len(rows) < 2:
        return []

    col_index = {name: i for i, name in enumerate(columns)}
    tasks = []

    for row in rows[1:]:
        if not row or not any(cell.strip() for cell in row):
            continue

        def get(col_name):
            idx = col_index.get(col_name)
            if idx is not None and idx < len(row):
                return row[idx].strip()
            return ""

        description = get("description")
        if not description:
            continue

        status_raw = get("status").lower()
        is_done = status_raw in ("done", "complete", "completed", "x", "yes", "true")

        tasks.append({
            "description": description,
            "source": get("source"),
            "due": get("due"),
            "done": is_done,
        })

    return tasks


def format_task_line(task: dict) -> str:
    """Format a single task as a markdown checkbox line."""
    checkbox = "[x]" if task["done"] else "[ ]"
    parts = [f"- {checkbox} {task['description']}"]
    if task.get("source"):
        parts.append(f"*Source: {task['source']}*")
    if task.get("due"):
        label = "Done" if task["done"] else "Due"
        parts.append(f"{label}: {task['due']}")
    return " — ".join(parts)


def read_existing_tasks(tasks_path: Path) -> tuple[list[str], list[str]]:
    """Read existing tasks.md and return (local_open, local_completed) lines
    that were NOT imported from sheets (don't have the sheet marker)."""
    if not tasks_path.exists():
        return [], []

    content = tasks_path.read_text(encoding="utf-8")
    local_open = []
    local_completed = []

    for line in content.split("\n"):
        stripped = line.strip()
        if not stripped.startswith("- ["):
            continue
        if "<!-- sheet-import -->" in stripped:
            continue
        if stripped.startswith("- [x]"):
            local_completed.append(stripped)
        elif stripped.startswith("- [ ]"):
            local_open.append(stripped)

    return local_open, local_completed


def write_tasks_file(tasks_path: Path, account_name: str, sheet_tasks: list[dict],
                     local_open: list[str], local_completed: list[str]):
    """Write the merged tasks.md file."""
    sheet_open = [t for t in sheet_tasks if not t["done"]]
    sheet_done = [t for t in sheet_tasks if t["done"]]

    lines = [
        f"# Tasks: {account_name}",
        "",
        "> Small requests and action items. Imported from Google Sheets + local additions.",
        "",
        "---",
        "",
        "## Open",
        "",
    ]

    for t in sheet_open:
        lines.append(f"{format_task_line(t)} <!-- sheet-import -->")
    for line in local_open:
        lines.append(line)

    if not sheet_open and not local_open:
        lines.append("*No open tasks.*")

    lines.extend(["", "---", "", "## Completed", ""])

    for t in sheet_done:
        lines.append(f"{format_task_line(t)} <!-- sheet-import -->")
    for line in local_completed:
        lines.append(line)

    if not sheet_done and not local_completed:
        lines.append("*No completed tasks yet.*")

    lines.extend(["", "---", ""])

    tasks_path.write_text("\n".join(lines), encoding="utf-8")


def import_account(account_name: str, service, columns: list[str], dry_run: bool = False):
    """Import tasks from Google Sheets for a single account."""
    account_dir = ACCOUNTS_DIR / account_name
    if not account_dir.exists():
        print(f"  Skip: account directory not found at {account_dir}")
        return False

    meta = read_account_meta(account_dir)
    sheet_id = meta.get("google_sheet_id", "")
    if not sheet_id:
        print(f"  Skip: no google_sheet_id in meta.json for {account_name}")
        return False

    print(f"  Fetching sheet {sheet_id}...")
    rows = fetch_sheet_rows(service, sheet_id)
    tasks = parse_rows(rows, columns)
    print(f"  Found {len(tasks)} tasks ({sum(1 for t in tasks if not t['done'])} open, {sum(1 for t in tasks if t['done'])} done)")

    if dry_run:
        for t in tasks:
            print(f"    {format_task_line(t)}")
        return True

    tasks_path = account_dir / "tasks.md"
    local_open, local_completed = read_existing_tasks(tasks_path)

    display_name = meta.get("account_name", account_name)
    write_tasks_file(tasks_path, display_name, tasks, local_open, local_completed)
    print(f"  Written to {tasks_path}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Import Google Sheets tasks into account folders")
    parser.add_argument("account", nargs="?", help="Account folder name (e.g. acme-corp)")
    parser.add_argument("--all", action="store_true", help="Import for all accounts with a google_sheet_id")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing files")
    parser.add_argument("--columns", default=",".join(DEFAULT_COLUMNS),
                        help=f"Comma-separated column mapping (default: {','.join(DEFAULT_COLUMNS)})")
    args = parser.parse_args()

    if not args.account and not args.all:
        parser.error("Provide an account name or use --all")

    columns = [c.strip() for c in args.columns.split(",")]
    service = get_sheets_service()

    if args.all:
        if not ACCOUNTS_DIR.exists():
            print(f"No accounts directory at {ACCOUNTS_DIR}")
            sys.exit(1)
        count = 0
        for d in sorted(ACCOUNTS_DIR.iterdir()):
            if not d.is_dir() or d.name.startswith("."):
                continue
            meta = read_account_meta(d)
            if meta.get("google_sheet_id"):
                print(f"\n[{d.name}]")
                if import_account(d.name, service, columns, args.dry_run):
                    count += 1
        print(f"\nDone. Imported {count} account(s).")
    else:
        print(f"\n[{args.account}]")
        import_account(args.account, service, columns, args.dry_run)
        print("\nDone.")


if __name__ == "__main__":
    main()
