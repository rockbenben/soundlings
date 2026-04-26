#!/usr/bin/env python3
"""Generate CREDITS.md from public/assets/LICENSES.json.

Groups entries by license family, highlights anything that *requires*
attribution (CC BY, CC BY-SA), and emits a stable, diff-friendly markdown
file at the repo root.

Run from anywhere:
    python scripts/generate_credits.py
"""
import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
LICENSES = ROOT / "public" / "assets" / "LICENSES.json"
OUT = ROOT / "CREDITS.md"


def _family(name: str) -> str:
    n = name.lower()
    if "cc0" in n or "publicdomain" in n:
        return "CC0 1.0 — Public Domain Dedication"
    if "by-sa" in n.replace(" ", "").lower():
        return "CC BY-SA 4.0 — Attribution + ShareAlike"
    if "by" in n.split():
        return "CC BY 4.0 — Attribution"
    if "cc by 4.0" in n.lower():
        return "CC BY 4.0 — Attribution"
    return name


def main() -> int:
    licenses = json.loads(LICENSES.read_text(encoding="utf-8"))["licenses"]

    groups: dict[str, list[tuple[str, dict]]] = defaultdict(list)
    for key, entry in licenses.items():
        fam = _family(entry["name"])
        groups[fam].append((key, entry))

    for fam in groups:
        groups[fam].sort(key=lambda kv: kv[0])

    parts: list[str] = [
        "# Soundlings — Audio Credits",
        "",
        "Every audio file ships under an open-source license that **permits free",
        "redistribution**. The vast majority are **CC0** (public domain dedication —",
        "no attribution legally required, but credited below as a courtesy). Files",
        "that require attribution under their license are highlighted explicitly.",
        "",
        "_This file is generated from `public/assets/LICENSES.json` by",
        "`scripts/generate_credits.py`. Edit the JSON, not this file._",
        "",
        "---",
        "",
    ]

    family_order = [
        "CC BY 4.0 — Attribution",
        "CC BY-SA 4.0 — Attribution + ShareAlike",
        "CC0 1.0 — Public Domain Dedication",
    ]
    rest = [f for f in groups if f not in family_order]
    for fam in family_order + sorted(rest):
        if fam not in groups:
            continue
        entries = groups[fam]
        parts.append(f"## {fam}")
        parts.append("")
        if "CC BY" in fam:
            parts.append(
                "> ⚠ Files in this section require attribution under their license. "
                "The credit lines below are the attribution notice."
            )
            parts.append("")
        for key, entry in entries:
            url = entry.get("source_url") or entry.get("url", "")
            attribution = entry["attribution"].strip()
            license_url = entry.get("url", "")
            link = f"[source]({url})" if url else ""
            license_link = f"[{entry['name']}]({license_url})" if license_url else entry["name"]
            parts.append(f"- **`{key}`** — {attribution} — {license_link} {link}".strip())
        parts.append("")

    parts.append("---")
    parts.append("")
    parts.append(
        "## Software license"
        "\n\nThe Soundlings application code is released under the [MIT License](LICENSE)."
    )
    parts.append("")

    OUT.write_text("\n".join(parts), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(licenses)} entries, {len(groups)} families)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
