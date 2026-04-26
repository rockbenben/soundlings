#!/usr/bin/env python3
"""License compliance audit. Run in CI.

Fails (exit non-zero) when:
  1. A manifest variant references a license key that does not exist in
     LICENSES.json.
  2. LICENSES.json contains a key that no manifest variant references
     (orphan — must be cleaned up).
  3. An audio file exists on disk but no manifest variant points to it.
  4. A manifest variant points to an audio file that is missing on disk.
  5. Any LICENSES.json entry uses a license family that is incompatible
     with MIT redistribution (anything in DENY_LIST below).
  6. Any non-CC0 entry is missing required attribution metadata
     (`attribution`, `url`).

Allowed license families (compatible with MIT redistribution):
  - CC0 1.0
  - CC BY 4.0    (with attribution surfaced in CREDITS.md)
"""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path

# Force UTF-8 stdout/stderr so emoji/markers work on Windows GBK consoles too.
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
MANIFEST = ASSETS / "manifest.json"
LICENSES = ASSETS / "LICENSES.json"
AUDIO_DIR = ASSETS / "audio"

# License names we accept. Anything else fails the audit.
ALLOW_NAMES = {
    "CC0 1.0",
    "CC BY 4.0",
}
# Explicit deny list — for clarity in error messages when these appear.
DENY_FAMILIES = {
    "CC BY-SA": "ShareAlike clause is incompatible with MIT redistribution",
    "CC BY-NC": "NonCommercial clause forbids commercial redistribution",
    "CC BY-ND": "NoDerivatives clause forbids modification",
}


def fail(errors: list[str]) -> int:
    print("❌ License audit FAILED:", file=sys.stderr)
    for e in errors:
        print(f"  - {e}", file=sys.stderr)
    return 1


def main() -> int:
    errors: list[str] = []
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    licenses = json.loads(LICENSES.read_text(encoding="utf-8"))["licenses"]

    referenced_keys: set[str] = set()
    referenced_assets: set[str] = set()
    for preset in manifest["presets"]:
        for v in preset["variants"]:
            key = v.get("license", "")
            asset = v["asset"]
            referenced_keys.add(key)
            referenced_assets.add(asset)
            if key not in licenses:
                errors.append(f"manifest variant references missing license key: {key} (for {asset})")
            asset_path = ROOT / "public" / asset
            if not asset_path.exists():
                errors.append(f"manifest references missing audio file: {asset}")

    # Orphan license entries
    for key in licenses:
        if key not in referenced_keys:
            errors.append(f"orphan license entry: {key} (no manifest variant uses it)")

    # On-disk audio files without manifest entry
    if AUDIO_DIR.exists():
        for path in AUDIO_DIR.rglob("*.mp3"):
            rel = path.relative_to(ROOT / "public").as_posix()
            if rel not in referenced_assets:
                errors.append(f"orphan audio file: {rel} (not referenced by manifest)")

    # License compatibility + attribution completeness
    for key, entry in licenses.items():
        name = entry.get("name", "").strip()
        if name not in ALLOW_NAMES:
            for fam, why in DENY_FAMILIES.items():
                if fam.lower() in name.lower().replace(" ", ""):
                    errors.append(f"{key}: incompatible license '{name}' — {why}")
                    break
            else:
                errors.append(f"{key}: license '{name}' not in allow list {sorted(ALLOW_NAMES)}")

        # Non-CC0 must have attribution + url
        if name != "CC0 1.0":
            if not entry.get("attribution", "").strip():
                errors.append(f"{key}: missing 'attribution' (required for {name})")
            if not entry.get("url", "").strip():
                errors.append(f"{key}: missing 'url' (required for {name})")

    if errors:
        return fail(errors)

    print(
        f"✅ License audit OK — {len(referenced_keys)} keys, "
        f"{len(referenced_assets)} audio files, "
        f"{sum(1 for e in licenses.values() if e['name'] != 'CC0 1.0')} non-CC0 entries with attribution."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
