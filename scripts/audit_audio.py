#!/usr/bin/env python3
"""Audit every sound file: duration, mean volume, silent detection.

Outputs a table of (category/iconKey, duration, mean_dB, status, source).
"""
import io
import json
import os
import re
import subprocess
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def probe(path: str):
    """Return (duration_seconds, mean_dB)."""
    # Duration
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True,
    )
    try:
        dur = float(r.stdout.strip())
    except ValueError:
        dur = 0.0

    # Mean volume (parse from volumedetect filter stderr)
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path, "-af", "volumedetect",
         "-f", "null", "-"],
        capture_output=True, text=True,
    )
    m = re.search(r"mean_volume:\s*(-?\d+\.\d+)\s*dB", r.stderr)
    mean = float(m.group(1)) if m else None
    return dur, mean


def main():
    with open("assets/manifest.json", encoding="utf-8") as f:
        manifest = json.load(f)
    with open("assets/LICENSES.json", encoding="utf-8") as f:
        licenses = json.load(f)["licenses"]

    by_icon = {}
    for p in manifest["presets"]:
        for v in p["variants"]:
            asset = v["asset"]  # e.g. assets/audio/animals/cat.mp3
            cat, fn = asset.split("/")[-2:]
            icon = fn.replace(".mp3", "")
            by_icon[(cat, icon)] = (p["id"], p["labels"].get("zh", ""))

    rows = []
    for cat in ["vehicles", "nature", "animals", "instruments",
                "household", "ambience"]:
        cat_dir = f"assets/audio/{cat}"
        for fn in sorted(os.listdir(cat_dir)):
            if not fn.endswith(".mp3"):
                continue
            icon = fn.replace(".mp3", "")
            path = f"{cat_dir}/{fn}"
            dur, mean = probe(path)
            # Find which license entry covers this file
            license_key = None
            for k in [f"freesound_{icon}", f"freesound_attr_{icon}",
                      f"commons_{icon}"]:
                if k in licenses:
                    license_key = k
                    break
            attr = licenses.get(license_key, {}).get("attribution", "?") \
                if license_key else "(no license entry)"
            url = licenses.get(license_key, {}).get("url", "") \
                if license_key else ""

            # Status: silent if mean < -50 dB or no mean
            if mean is None:
                status = "❌ NO AUDIO STREAM"
            elif mean < -50:
                status = f"🔇 SILENT (mean={mean:.1f}dB)"
            elif mean < -35:
                status = f"⚠️  very quiet ({mean:.1f}dB)"
            elif dur < 0.4:
                status = f"⚠️  too short ({dur:.2f}s)"
            else:
                status = "✅"

            rows.append((cat, icon, dur, mean, status, attr, url))

    # Print table
    print(f"{'Cat/Icon':<32} {'Dur':>6} {'Mean':>8}  {'Status':<28} Source")
    print("-" * 130)
    silent = []
    suspicious = []
    for cat, icon, dur, mean, status, attr, url in rows:
        ki = f"{cat}/{icon}"
        mean_s = f"{mean:.1f}dB" if mean is not None else "  n/a"
        attr_short = (attr or "?")[:55]
        print(f"{ki:<32} {dur:>5.2f}s {mean_s:>8}  {status:<28} {attr_short}")
        if "SILENT" in status or "NO AUDIO" in status:
            silent.append((cat, icon, attr, url))
        elif "very quiet" in status or "too short" in status:
            suspicious.append((cat, icon, status, attr, url))

    print()
    print(f"Total: {len(rows)} files")
    print(f"Silent / no audio: {len(silent)}")
    print(f"Suspicious (very quiet or very short): {len(suspicious)}")
    if silent:
        print("\n=== SILENT FILES (need replacement) ===")
        for cat, icon, attr, url in silent:
            print(f"  {cat}/{icon}  ←  {attr}  {url}")
    if suspicious:
        print("\n=== SUSPICIOUS FILES (review) ===")
        for cat, icon, status, attr, url in suspicious:
            print(f"  {cat}/{icon}  [{status}]  ←  {attr}  {url}")


if __name__ == "__main__":
    main()
