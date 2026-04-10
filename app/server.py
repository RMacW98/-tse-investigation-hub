#!/usr/bin/env python3
"""
TSE Hub - Local web interface for TSE customer case investigations.

Usage:
    python server.py              # Start on http://localhost:5099
    python server.py --port 8080  # Custom port
"""

import os
import re
import sys
import json
import time
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

from flask import Flask, render_template, request, jsonify, abort, Response, send_from_directory

import markdown
from markdown.extensions.codehilite import CodeHiliteExtension
from markdown.extensions.fenced_code import FencedCodeExtension
from markdown.extensions.tables import TableExtension
from markdown.extensions.toc import TocExtension

# ── Paths ────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
CASES_DIR = ROOT / "cases"
ARCHIVE_DIR = ROOT / "archive"
SOLUTIONS_DIR = ROOT / "solutions"
TEMPLATES_DIR = ROOT / "templates"
DOCS_DIR = ROOT / "docs"

# ── JIRA Client ──────────────────────────────────────────────────────────────

sys.path.insert(0, str(ROOT / "scripts"))


def _jira_fetch(key: str) -> dict | None:
    """Fetch a single JIRA issue. Returns None on failure."""
    try:
        import jira_client as jc
        return jc.get_issue(key)
    except BaseException:
        return None


def _extract_jira_activity(issue: dict, max_comments: int = 2) -> dict:
    """Extract status, summary, assignee, updated, and last N comments."""
    fields = issue.get("fields", {})
    try:
        import jira_client as jc
    except Exception:
        jc = None

    status = fields.get("status", {}).get("name", "Unknown")
    updated = fields.get("updated", "")[:16].replace("T", " ")
    summary = fields.get("summary", "")

    assignee_field = fields.get("customfield_11300", []) or []
    assignees = [a.get("displayName", "") for a in assignee_field if a] if assignee_field else []

    comments_raw = fields.get("comment", {}).get("comments", [])
    recent_comments = []
    for c in comments_raw[-max_comments:]:
        author = c.get("author", {}).get("displayName", "Unknown")
        date = c.get("created", "")[:10]
        body = ""
        if jc:
            body = jc.extract_text(c.get("body", {}))
        if len(body) > 300:
            body = body[:300] + "..."
        recent_comments.append({"author": author, "date": date, "body": body})

    return {
        "key": issue.get("key", ""),
        "status": status,
        "summary": summary,
        "updated": updated,
        "assignees": assignees,
        "last_comments": recent_comments,
        "url": f"https://datadoghq.atlassian.net/browse/{issue.get('key', '')}",
    }


_NON_JIRA_PREFIXES = {"ZD", "HTTP", "SHA", "MD", "TLS", "SSL", "TCP", "UDP", "RFC"}

def extract_jira_keys(text: str) -> list[str]:
    """Find all JIRA ticket references (e.g. APMS-1234, LOGS-567) in text."""
    candidates = re.findall(r"\b([A-Z][A-Z0-9]+)-(\d+)\b", text)
    return sorted(set(
        f"{prefix}-{num}" for prefix, num in candidates
        if prefix not in _NON_JIRA_PREFIXES
    ))


def fetch_escalations(jira_keys: list[str]) -> list[dict]:
    """Fetch JIRA details for a list of JIRA keys."""
    results = []
    for key in jira_keys:
        issue = _jira_fetch(key)
        if issue:
            results.append(_extract_jira_activity(issue))
    return results


_SA_URL_RE = re.compile(r"support-admin\.[^/]*\.prod\.dog", re.I)
_MD_LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^\)]+)\)")
_LABELED_URL_RE = re.compile(r"-\s+\*\*([^*]+)\*\*:?\s+(https?://\S+)")
_BARE_URL_RE = re.compile(r"https?://[^\s\)\]>\"']+")


def _extract_support_admin_links(raw_text: str) -> list[dict]:
    """Extract support-admin (Partlow) links with labels from markdown text."""
    seen: set[str] = set()
    links: list[dict] = []

    for m in _MD_LINK_RE.finditer(raw_text):
        label, url = m.group(1).strip(), m.group(2).strip()
        if _SA_URL_RE.search(url) and url not in seen:
            seen.add(url)
            links.append({"label": label, "url": url})

    for m in _LABELED_URL_RE.finditer(raw_text):
        label, url = m.group(1).strip().rstrip(":"), m.group(2).strip().rstrip(".,;:!?)")
        if _SA_URL_RE.search(url) and url not in seen:
            seen.add(url)
            links.append({"label": label, "url": url})

    for m in _BARE_URL_RE.finditer(raw_text):
        url = m.group(0).rstrip(".,;:!?)")
        if _SA_URL_RE.search(url) and url not in seen:
            seen.add(url)
            links.append({"label": "Support Admin", "url": url})

    return links


# ── Flask App ────────────────────────────────────────────────────────────────

app = Flask(
    __name__,
    template_folder=str(Path(__file__).parent / "templates"),
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def render_md(text: str) -> str:
    """Render markdown to HTML with syntax highlighting and tables."""
    extensions = [
        FencedCodeExtension(),
        CodeHiliteExtension(css_class="codehilite", guess_lang=False),
        TableExtension(),
        TocExtension(permalink=False),
        "nl2br",
    ]
    return markdown.markdown(text, extensions=extensions)


def read_md_file(path: Path) -> dict | None:
    """Read a markdown file and return metadata + rendered HTML."""
    if not path.exists():
        return None
    raw = path.read_text(encoding="utf-8")
    title_match = re.match(r"^#\s+(.+)", raw, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else path.stem
    return {
        "title": title,
        "raw": raw,
        "html": render_md(raw),
        "path": str(path.relative_to(ROOT)),
        "modified": datetime.fromtimestamp(path.stat().st_mtime),
    }


# ── Status / Meta ────────────────────────────────────────────────────────────

VALID_STATUSES = ["new", "investigating", "waiting-on-customer", "escalated", "resolved"]
STATUS_LABELS = {
    "new": "New",
    "investigating": "Investigating",
    "waiting-on-customer": "Waiting on Customer",
    "escalated": "Escalated",
    "resolved": "Resolved",
}
STATUS_COLORS = {
    "new": "purple",
    "investigating": "blue",
    "waiting-on-customer": "amber",
    "escalated": "red",
    "resolved": "green",
}


ISSUE_TYPE_LABELS = {
    "billing-question": "Billing Question",
    "billing-bug": "Billing Bug",
    "technical-question": "Technical Question",
    "technical-bug": "Technical Bug",
    "configuration-troubleshooting": "Config Troubleshooting",
    "feature-request": "Feature Request",
    "incident": "Incident",
}

ISSUE_TYPE_COLORS = {
    "billing-question": "sky",
    "billing-bug": "rose",
    "technical-question": "indigo",
    "technical-bug": "red",
    "configuration-troubleshooting": "amber",
    "feature-request": "teal",
    "incident": "fuchsia",
}


def _read_meta(case_dir: Path) -> dict:
    """Read meta.json from a case folder, returning defaults if missing."""
    meta_path = case_dir / "meta.json"
    meta = {"status": "new", "assignee": "", "priority": "", "issue_type": ""}
    if meta_path.exists():
        try:
            data = json.loads(meta_path.read_text())
            if data.get("status") in VALID_STATUSES:
                meta["status"] = data["status"]
            if data.get("assignee"):
                meta["assignee"] = str(data["assignee"]).strip()
            if data.get("priority"):
                meta["priority"] = str(data["priority"]).strip()
            if data.get("issue_type"):
                meta["issue_type"] = str(data["issue_type"]).strip()
        except Exception:
            pass
    return meta


# ── Product Area Detection ───────────────────────────────────────────────────

PRODUCT_AREA_RULES = [
    ("apm", "APM", [
        r"\bapm\b", r"\btrac(e|es|ing)\b", r"\bprofil(e|er|ing)\b",
        r"\bspan\b", r"\bservice\s*map", r"\bdd-trace",
    ]),
    ("infrastructure", "Infrastructure", [
        r"\binfrastructure\b", r"\bagent\s*(v?\d|check|flare|config)",
        r"\bhost\s*monitor", r"\bcontainer\s*monitor",
        r"\bkubernetes\b", r"\becs\b", r"\bprocess\s*agent",
    ]),
    ("logs", "Logs", [
        r"\blog\s*(management|collection|pipeline|parsing|archive|index)",
        r"\bpipeline\b", r"\bparsing\s*rule", r"\blog\s*explorer",
    ]),
    ("rum", "RUM", [
        r"\brum\b", r"\breal\s*user\s*monitor", r"\bsession\s*replay",
        r"\bbrowser\s*sdk\b",
    ]),
    ("synthetics", "Synthetics", [
        r"\bsynthetic", r"\bapi\s*test", r"\bbrowser\s*test",
        r"\bcontinuous\s*testing",
    ]),
    ("security", "Security", [
        r"\bsecurity\b", r"\bappsec\b", r"\bsiem\b", r"\bcspm\b",
        r"\bcws\b", r"\bvulnerability\s*manage",
    ]),
    ("network", "Network", [
        r"\bnetwork\s*(performance|device|monitor)", r"\bnpm\b",
        r"\bnetflow\b", r"\bdns\s*monitor",
    ]),
    ("platform", "Platform", [
        r"\bbilling\b", r"\bsso\b", r"\bsaml\b", r"\bapi\s*key",
        r"\bdashboard\s*(widget|template|api)",
        r"\brbac\b", r"\baudit\s*trail",
    ]),
    ("other", "Other", []),
]

_COMPILED_AREA_RULES = [
    (key, label, [re.compile(p, re.IGNORECASE) for p in patterns])
    for key, label, patterns in PRODUCT_AREA_RULES
]

PRODUCT_AREA_LABELS = {key: label for key, label, _pats in PRODUCT_AREA_RULES}


def detect_product_area(text: str) -> str:
    """Detect product area from text. Returns area key, falls back to 'other'."""
    for key, _label, patterns in _COMPILED_AREA_RULES:
        for pat in patterns:
            if pat.search(text):
                return key
    return "other"


# ── Data Source Extraction ───────────────────────────────────────────────────

_SOURCE_TYPES = [
    ("jira", "JIRA", [
        re.compile(r"https?://datadoghq\.atlassian\.net/browse/([\w-]+)", re.I),
    ], [
        re.compile(r"\b([A-Z][A-Z0-9]+-\d+)\b"),
    ]),
    ("zendesk", "Zendesk", [
        re.compile(r"https?://[\w.-]*zendesk\.com[\w/._?&#%-]*", re.I),
    ], [
        re.compile(r"\bZD-\d+\b"),
    ]),
    ("confluence", "Confluence", [
        re.compile(r"https?://datadoghq\.atlassian\.net/wiki/[\w/+.-]+", re.I),
    ], []),
    ("datadog_docs", "Datadog Docs", [
        re.compile(r"https?://docs\.datadoghq\.com/[\w/._?&#%-]+", re.I),
    ], []),
    ("github", "GitHub", [
        re.compile(r"https?://github\.com/[\w.-]+/[\w.-]+[\w/._?&#%-]*", re.I),
    ], []),
    ("slack", "Slack", [
        re.compile(r"https?://dd\.(?:enterprise\.)?slack\.com/[\w/.-]+", re.I),
    ], []),
]


def _extract_ticket_number(text: str) -> str | None:
    """Pull the bare numeric ID from a ZD ref or Zendesk URL."""
    m = re.search(r"(?:ZD-|/tickets/)(\d+)", text)
    return m.group(1) if m else None


def extract_sources(raw_text: str) -> list:
    """Extract data source references from markdown text."""
    sources = []
    for src_key, src_label, url_patterns, ref_patterns in _SOURCE_TYPES:
        refs_seen = set()
        ticket_ids_seen: set[str] = set()
        refs = []

        for url_pat in url_patterns:
            for match in url_pat.finditer(raw_text):
                url = match.group(0).rstrip(")")
                display = url
                if src_key == "jira" and match.lastindex and match.lastindex >= 1:
                    display = match.group(1)
                dedup_key = (url, display)
                if dedup_key not in refs_seen:
                    refs_seen.add(dedup_key)
                    refs.append({"url": url, "display": display})
                    tid = _extract_ticket_number(url)
                    if tid:
                        ticket_ids_seen.add(tid)

        for ref_pat in ref_patterns:
            for match in ref_pat.finditer(raw_text):
                ref_text = match.group(0)

                if src_key == "jira":
                    prefix = ref_text.split("-")[0]
                    if prefix in _NON_JIRA_PREFIXES:
                        continue

                tid = _extract_ticket_number(ref_text)
                if tid and tid in ticket_ids_seen:
                    continue

                already = False
                for r in refs:
                    d = r.get("display") or ""
                    u = r.get("url") or ""
                    if ref_text in d or ref_text in u:
                        already = True
                        break
                if already:
                    continue
                dedup_key = (ref_text, ref_text)
                if dedup_key not in refs_seen:
                    refs_seen.add(dedup_key)
                    if tid:
                        ticket_ids_seen.add(tid)
                    url = None
                    if src_key == "jira":
                        url = f"https://datadoghq.atlassian.net/browse/{ref_text}"
                    refs.append({"url": url, "display": ref_text})

        if refs:
            sources.append({"key": src_key, "label": src_label, "refs": refs})

    return sources


# ── Case Loader ──────────────────────────────────────────────────────────────

def get_cases() -> list:
    """List all active cases sorted by last modified (newest first)."""
    if not CASES_DIR.exists():
        return []
    cases = []
    for d in CASES_DIR.iterdir():
        if not d.is_dir() or d.name.startswith("."):
            continue
        case_key = d.name
        notes_path = d / "notes.md"
        readme_path = d / "README.md"

        title = case_key
        for check_path in (readme_path, notes_path):
            if check_path.exists():
                first_line = check_path.read_text(encoding="utf-8").split("\n")[0]
                heading = re.match(r"^#\s+(.+)", first_line)
                if heading:
                    title = heading.group(1).strip()
                    break

        meta = _read_meta(d)
        md_files = sorted(d.glob("*.md"))
        mod_times = [f.stat().st_mtime for f in d.rglob("*") if f.is_file()]
        last_modified = datetime.fromtimestamp(max(mod_times)) if mod_times else None

        area_text = title
        for p in (notes_path, readme_path):
            if p.exists():
                try:
                    area_text += " " + p.read_text(encoding="utf-8", errors="ignore")[:2000]
                except Exception:
                    pass
        product_area = detect_product_area(area_text)

        cases.append({
            "key": case_key,
            "title": title,
            "has_notes": notes_path.exists(),
            "has_readme": readme_path.exists(),
            "has_response": (d / "response.md").exists(),
            "files": [f.name for f in md_files],
            "file_count": len(md_files),
            "last_modified": last_modified,
            "status": meta["status"],
            "assignee": meta["assignee"],
            "priority": meta["priority"],
            "product_area": product_area,
            "issue_type": meta["issue_type"],
        })

    cases.sort(key=lambda x: x["last_modified"] or datetime.min, reverse=True)
    return cases


# ── Archive Loader ───────────────────────────────────────────────────────────

def get_archive_months() -> list:
    """List archive months with ticket counts."""
    if not ARCHIVE_DIR.exists():
        return []

    def _month_sort_key(d):
        try:
            parts = d.name.split("-")
            return (int(parts[1]), int(parts[0]))
        except (IndexError, ValueError):
            return (0, 0)

    months = []
    for d in sorted(ARCHIVE_DIR.iterdir(), key=_month_sort_key, reverse=True):
        if not d.is_dir():
            continue
        tickets = sorted(d.glob("*.md"), reverse=True)
        ticket_list = []
        for t in tickets:
            title = t.stem
            content_preview = ""
            try:
                content_preview = t.read_text(encoding="utf-8", errors="ignore")[:2000]
                for line in content_preview.split("\n", 5):
                    heading = re.match(r"^#\s+(.+)", line)
                    if heading:
                        title = heading.group(1).strip()
                        break
            except Exception:
                pass
            area = detect_product_area(content_preview)
            ticket_list.append({
                "key": t.stem,
                "path": str(t.relative_to(ROOT)),
                "title": title,
                "product_area": area,
            })
        months.append({"name": d.name, "count": len(ticket_list), "tickets": ticket_list})
    return months


# ── Templates Loader ─────────────────────────────────────────────────────────

def get_template_categories() -> list:
    """Load template categories and their files."""
    if not TEMPLATES_DIR.exists():
        return []
    categories = []
    for sub in sorted(TEMPLATES_DIR.iterdir()):
        if not sub.is_dir() or sub.name.startswith("."):
            continue
        files = []
        for f in sorted(sub.glob("*.md")):
            files.append({
                "name": f.stem.replace("-", " ").replace("_", " ").title(),
                "filename": f.name,
                "path": str(f.relative_to(ROOT)),
            })
        if files:
            categories.append({
                "name": sub.name.replace("-", " ").replace("_", " ").title(),
                "dir_name": sub.name,
                "files": files,
            })
    return categories


# ── Known Issues Loader ──────────────────────────────────────────────────────

def get_known_issues() -> dict | None:
    """Load and render solutions/known-issues.md."""
    ki_path = SOLUTIONS_DIR / "known-issues.md"
    return read_md_file(ki_path)


# ── Docs Loader ──────────────────────────────────────────────────────────────

def get_docs_tree(base_dir: Path = None) -> list:
    """Build a tree of documentation files."""
    if base_dir is None:
        base_dir = DOCS_DIR
    if not base_dir.exists():
        return []
    tree = []
    for item in sorted(base_dir.iterdir()):
        if item.name.startswith(".") or item.name.startswith("_"):
            continue
        if item.is_dir():
            children = get_docs_tree(item)
            if children:
                tree.append({"type": "dir", "name": item.name, "children": children})
        elif item.suffix == ".md":
            tree.append({
                "type": "file",
                "name": item.stem,
                "path": str(item.relative_to(ROOT)),
            })
    return tree


# ── Search ───────────────────────────────────────────────────────────────────

def search_files(query: str, max_results: int = 50) -> list:
    """Search all markdown files for a query string (case-insensitive)."""
    results = []
    query_lower = query.lower()
    search_dirs = [CASES_DIR, ARCHIVE_DIR, SOLUTIONS_DIR, DOCS_DIR, TEMPLATES_DIR]

    for search_dir in search_dirs:
        if not search_dir.exists():
            continue
        for md_file in search_dir.rglob("*.md"):
            if md_file.name.startswith("."):
                continue
            try:
                content = md_file.read_text(encoding="utf-8")
            except Exception:
                continue

            if query_lower not in content.lower():
                continue

            lines = content.split("\n")
            snippets = []
            for i, line in enumerate(lines):
                if query_lower in line.lower():
                    start = max(0, i - 1)
                    end = min(len(lines), i + 2)
                    snippet = "\n".join(lines[start:end]).strip()
                    snippets.append(snippet)
                    if len(snippets) >= 2:
                        break

            title_match = re.match(r"^#\s+(.+)", content, re.MULTILINE)
            title = title_match.group(1).strip() if title_match else md_file.stem
            rel = md_file.relative_to(ROOT)
            section = str(rel).split("/")[0]

            results.append({
                "title": title,
                "path": str(rel),
                "section": section,
                "snippets": snippets,
                "modified": datetime.fromtimestamp(md_file.stat().st_mtime),
            })
            if len(results) >= max_results:
                return results

    results.sort(key=lambda r: r["modified"], reverse=True)
    return results


# ── Context Processor ────────────────────────────────────────────────────────

@app.context_processor
def inject_globals():
    """Make counts and metadata available to all templates."""
    case_count = len(get_cases())
    archive_months = get_archive_months()
    return {
        "nav_case_count": case_count,
        "nav_archive_count": sum(m["count"] for m in archive_months),
        "nav_doc_count": len(list(DOCS_DIR.rglob("*.md"))) if DOCS_DIR.exists() else 0,
    }


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def dashboard():
    cases = get_cases()
    archive_months = get_archive_months()
    total_archived = sum(m["count"] for m in archive_months)
    known_issues = get_known_issues()
    ki_count = 0
    if known_issues:
        ki_count = len(re.findall(r"^###\s+", known_issues["raw"], re.MULTILINE))
    return render_template(
        "dashboard.html",
        cases=cases,
        archive_months=archive_months,
        total_archived=total_archived,
        known_issues_count=ki_count,
    )


@app.route("/cases")
def cases_list():
    cases = get_cases()
    assignees = sorted(set(c["assignee"] for c in cases if c["assignee"]))
    seen_areas = set()
    product_areas = []
    for c in cases:
        area = c.get("product_area", "other")
        if area not in seen_areas:
            seen_areas.add(area)
            product_areas.append(area)
    canonical_order = [key for key, _, _ in PRODUCT_AREA_RULES]
    product_areas.sort(key=lambda a: (a == "other", canonical_order.index(a) if a in canonical_order else 999))
    return render_template(
        "cases.html",
        cases=cases,
        assignees=assignees,
        statuses=VALID_STATUSES,
        status_labels=STATUS_LABELS,
        status_colors=STATUS_COLORS,
        product_areas=product_areas,
        area_labels=PRODUCT_AREA_LABELS,
        issue_type_labels=ISSUE_TYPE_LABELS,
        issue_type_colors=ISSUE_TYPE_COLORS,
    )


@app.route("/case/<key>")
def case_detail(key):
    case_dir = CASES_DIR / key
    if not case_dir.exists() or not case_dir.is_dir():
        abort(404)

    md_files = {}
    for f in sorted(case_dir.glob("*.md")):
        data = read_md_file(f)
        if data:
            md_files[f.name] = data

    readme = md_files.get("README.md")
    notes = md_files.get("notes.md")
    response = md_files.get("response.md")
    other_files = {k: v for k, v in md_files.items() if k not in ("README.md", "notes.md", "response.md")}

    assets_dir = case_dir / "assets"
    assets = []
    if assets_dir.exists():
        for asset in assets_dir.rglob("*"):
            if asset.is_file() and not asset.name.startswith("."):
                assets.append({
                    "name": asset.name,
                    "path": str(asset.relative_to(ROOT)),
                    "size": asset.stat().st_size,
                    "is_image": asset.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif", ".webp"),
                })

    all_cases = get_cases()
    all_keys = [c["key"] for c in all_cases]
    current_idx = all_keys.index(key) if key in all_keys else -1
    prev_key = all_keys[current_idx - 1] if current_idx > 0 else None
    next_key = all_keys[current_idx + 1] if 0 <= current_idx < len(all_keys) - 1 else None

    meta = _read_meta(case_dir)

    all_raw = ""
    for _name, fdata in md_files.items():
        all_raw += fdata["raw"] + "\n"
    sources = extract_sources(all_raw)

    jira_keys = extract_jira_keys(all_raw)
    escalations = fetch_escalations(jira_keys) if jira_keys else []

    support_admin_links = _extract_support_admin_links(all_raw)

    return render_template(
        "case_detail.html",
        key=key,
        readme=readme,
        notes=notes,
        response=response,
        other_files=other_files,
        assets=assets,
        prev_key=prev_key,
        next_key=next_key,
        meta=meta,
        valid_statuses=VALID_STATUSES,
        status_labels=STATUS_LABELS,
        status_colors=STATUS_COLORS,
        issue_type_labels=ISSUE_TYPE_LABELS,
        issue_type_colors=ISSUE_TYPE_COLORS,
        sources=sources,
        sources_count=sum(len(s["refs"]) for s in sources),
        escalations=escalations,
        support_admin_links=support_admin_links,
    )


@app.route("/case/<key>/assets/<path:filename>")
def case_asset(key, filename):
    """Serve a file from a case's assets folder."""
    assets_dir = CASES_DIR / key / "assets"
    if not assets_dir.exists():
        abort(404)
    return send_from_directory(assets_dir, filename)


def _build_escalation_context(case_dir: Path, key: str) -> dict:
    """Extract structured context from case files to pre-populate an escalation."""
    readme_path = case_dir / "README.md"
    notes_path = case_dir / "notes.md"
    meta = _read_meta(case_dir)

    readme_raw = readme_path.read_text(encoding="utf-8") if readme_path.exists() else ""
    notes_raw = notes_path.read_text(encoding="utf-8") if notes_path.exists() else ""
    combined = readme_raw + "\n" + notes_raw

    product_area = detect_product_area(combined)
    area_label = PRODUCT_AREA_LABELS.get(product_area, "")

    title_match = re.match(r"^#\s+(.+)", readme_raw or notes_raw, re.MULTILINE)
    case_title = title_match.group(1).strip() if title_match else key

    def _extract_section(text: str, heading: str) -> str:
        pattern = rf"(?:^|\n)##?\s*{re.escape(heading)}\s*\n([\s\S]*?)(?=\n##?\s|\Z)"
        m = re.search(pattern, text, re.IGNORECASE)
        return m.group(1).strip() if m else ""

    environment = _extract_section(readme_raw, "Environment") or _extract_section(notes_raw, "Environment")
    issue_summary = _extract_section(readme_raw, "Issue Summary") or _extract_section(readme_raw, "What's Happening")
    what_tried = _extract_section(notes_raw, "What We've Tried") or _extract_section(notes_raw, "Actions Taken")
    ruled_out = _extract_section(notes_raw, "What We've Ruled Out") or _extract_section(notes_raw, "Root Cause Analysis")
    evidence = _extract_section(notes_raw, "Evidence") or _extract_section(notes_raw, "Logs")
    root_cause = _extract_section(notes_raw, "Likely Root Cause") or _extract_section(notes_raw, "Root Cause Analysis")

    summary = f"{area_label + ' - ' if area_label and area_label != 'Other' else ''}{case_title}"
    if summary.startswith("Case: "):
        summary = summary.replace("Case: ", "", 1)

    # -- Collect all links from case files --
    # 1) Parse the curated "Investigation Links" section (labeled markdown links)
    inv_links_section = _extract_section(readme_raw, "Investigation Links") or _extract_section(notes_raw, "Investigation Links")
    _all_labeled: list[dict] = []
    seen_urls: set[str] = set()

    if inv_links_section:
        md_link_re = re.compile(r"\[([^\]]+)\]\((https?://[^\)]+)\)")
        for m in md_link_re.finditer(inv_links_section):
            label, url = m.group(1).strip(), m.group(2).strip()
            if url not in seen_urls:
                seen_urls.add(url)
                _all_labeled.append({"label": label, "url": url})

        labeled_url_re = re.compile(r"-\s+\*\*([^*]+)\*\*:?\s+(https?://\S+)")
        for m in labeled_url_re.finditer(inv_links_section):
            label, url = m.group(1).strip().rstrip(":"), m.group(2).strip().rstrip(".,;:!?)")
            if url not in seen_urls:
                seen_urls.add(url)
                _all_labeled.append({"label": label, "url": url})

    # 2) Collect remaining URLs from the full case text
    _url_re = re.compile(r"https?://[^\s\)\]>\"']+")
    _all_unlabeled: list[str] = []
    for url_match in _url_re.finditer(combined):
        url = url_match.group(0).rstrip(".,;:!?)")
        if url not in seen_urls:
            seen_urls.add(url)
            _all_unlabeled.append(url)

    # 3) Split into: support-admin links (Partlow), investigation links, other links
    _sa_re = re.compile(r"support-admin\.[^/]*\.prod\.dog", re.I)

    support_admin_links = []
    investigation_links = []
    other_links = []

    for link in _all_labeled:
        if _sa_re.search(link["url"]):
            support_admin_links.append(link)
        else:
            investigation_links.append(link)

    for url in _all_unlabeled:
        if _sa_re.search(url):
            support_admin_links.append({"label": "Support Admin", "url": url})
        else:
            other_links.append(url)

    # -- Collect assets (screenshots + files) --
    image_exts = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
    screenshots = []
    files = []
    assets_dir = case_dir / "assets"
    if assets_dir.exists():
        for f in sorted(assets_dir.rglob("*")):
            if f.is_file() and not f.name.startswith("."):
                size = f.stat().st_size
                if size > 1048576:
                    size_str = f"{size / 1048576:.1f} MB"
                elif size > 1024:
                    size_str = f"{size / 1024:.1f} KB"
                else:
                    size_str = f"{size} B"
                entry = {
                    "name": f.name,
                    "path": str(f.relative_to(case_dir)),
                    "url": f"/case/{key}/assets/{f.name}",
                    "size": size_str,
                }
                if f.suffix.lower() in image_exts:
                    screenshots.append(entry)
                else:
                    files.append(entry)

    # -- Build description --
    desc_parts = []
    desc_parts.append(f"Zendesk Ticket: {key}")
    if issue_summary:
        desc_parts.append(f"\n--- Issue Description ---\n{issue_summary}")
    if environment:
        desc_parts.append(f"\n--- Environment ---\n{environment}")
    if what_tried:
        desc_parts.append(f"\n--- What We've Tried ---\n{what_tried}")
    if ruled_out:
        desc_parts.append(f"\n--- What We've Ruled Out ---\n{ruled_out}")
    if root_cause:
        desc_parts.append(f"\n--- Suspected Root Cause ---\n{root_cause}")
    if evidence:
        desc_parts.append(f"\n--- Relevant Evidence ---\n{evidence[:1500]}")

    if support_admin_links:
        desc_parts.append("\n--- Support Admin Links ---")
        for link in support_admin_links:
            desc_parts.append(f"- {link['label']}: {link['url']}")

    if investigation_links or other_links:
        desc_parts.append("\n--- Relevant Links ---")
        for link in investigation_links:
            desc_parts.append(f"- {link['label']}: {link['url']}")
        for url in other_links:
            desc_parts.append(f"- {url}")

    all_assets = screenshots + files
    if all_assets:
        desc_parts.append("\n--- Attachments ---")
        for a in all_assets:
            desc_parts.append(f"- {a['name']} ({a['size']})")
        desc_parts.append("(Attach these files to the JIRA ticket from the case assets folder)")

    if not any([issue_summary, what_tried, ruled_out]):
        desc_parts.append(
            "\n--- Investigation Summary ---\n"
            "[Describe the issue, what you've tried, and why this needs escalation]"
        )

    description = "\n".join(desc_parts)

    priority = meta.get("priority", "").capitalize() or "Medium"
    if priority not in ("Critical", "High", "Medium", "Low"):
        priority = "Medium"

    return {
        "summary": summary[:255],
        "description": description,
        "priority": priority,
        "product_area": area_label,
        "labels": ["tse-escalation", f"area-{product_area}"] if product_area != "other" else ["tse-escalation"],
        "support_admin_links": support_admin_links,
        "investigation_links": investigation_links,
        "other_links": other_links,
        "screenshots": screenshots,
        "files": files,
    }


@app.route("/api/case/<key>/escalation-context")
def escalation_context(key):
    """Return pre-populated escalation data for the modal."""
    case_dir = CASES_DIR / key
    if not case_dir.exists():
        abort(404)
    ctx = _build_escalation_context(case_dir, key)
    return jsonify(ctx)


@app.route("/known-issues")
def known_issues():
    data = get_known_issues()
    return render_template("known_issues.html", known_issues=data)


@app.route("/templates")
def templates_page():
    categories = get_template_categories()
    return render_template("templates_list.html", categories=categories)


@app.route("/templates/<category>/<filename>")
def template_detail(category, filename):
    tmpl_path = TEMPLATES_DIR / category / filename
    if not tmpl_path.suffix:
        tmpl_path = tmpl_path.with_suffix(".md")
    data = read_md_file(tmpl_path)
    if not data:
        abort(404)
    return render_template("template_detail.html", template=data, category=category)


@app.route("/docs")
def docs_page():
    tree = get_docs_tree()
    return render_template("docs.html", tree=tree)


@app.route("/docs/<path:filepath>")
def doc_detail(filepath):
    doc_path = DOCS_DIR / filepath
    if not doc_path.suffix:
        doc_path = doc_path.with_suffix(".md")
    data = read_md_file(doc_path)
    if not data:
        abort(404)
    return render_template("doc_detail.html", doc=data, filepath=filepath)


@app.route("/solutions/<filename>")
def solution_detail(filename):
    sol_path = SOLUTIONS_DIR / filename
    if not sol_path.suffix:
        sol_path = sol_path.with_suffix(".md")
    data = read_md_file(sol_path)
    if not data:
        abort(404)
    return render_template("solution_detail.html", solution=data, filename=filename)


@app.route("/archive")
def archive():
    months = get_archive_months()
    return render_template("archive.html", months=months, area_labels=PRODUCT_AREA_LABELS)


@app.route("/archive/<month>/<ticket_key>")
def archive_ticket(month, ticket_key):
    ticket_path = ARCHIVE_DIR / month / f"{ticket_key}.md"
    data = read_md_file(ticket_path)
    if not data:
        abort(404)
    content_preview = ""
    try:
        content_preview = ticket_path.read_text(encoding="utf-8", errors="ignore")[:2000]
    except Exception:
        pass
    area = detect_product_area(content_preview)
    return render_template(
        "archive_ticket.html",
        ticket=data,
        key=ticket_key,
        month=month,
        product_area=area,
        area_label=PRODUCT_AREA_LABELS.get(area, area),
    )


@app.route("/search")
def search():
    query = request.args.get("q", "").strip()
    results = []
    if query:
        results = search_files(query)
    return render_template("search.html", query=query, results=results)


@app.route("/api/search")
def api_search():
    """JSON search endpoint for AJAX."""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])
    results = search_files(query, max_results=20)
    for r in results:
        r["modified"] = r["modified"].isoformat()
    return jsonify(results)


# ── Error Handlers ───────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


# ── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="TSE Hub local web server")
    parser.add_argument("--port", type=int, default=5099, help="Port (default: 5099)")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    args = parser.parse_args()

    print(f"\n  TSE Hub running at http://localhost:{args.port}\n")
    print(f"  Workspace: {ROOT}")
    print(f"  Cases: {len(get_cases())}")
    print(f"  Archive months: {len(get_archive_months())}")
    print()

    app.run(host="127.0.0.1", port=args.port, debug=args.debug)
