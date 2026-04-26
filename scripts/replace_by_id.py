#!/usr/bin/env python3
"""Replace specific sound files by direct Freesound ID. Uses the public
preview URL pattern (no OAuth needed for previews) once we know the ID.

Run: FREESOUND_TOKEN=<t> python scripts/replace_by_id.py
"""
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

API = "https://freesound.org/apiv2"
TOKEN = os.environ.get("FREESOUND_TOKEN")
UA = "Soundlings/1.0"

# (cat, icon, freesound_id, max_dur_seconds)
TARGETS = [
    ("vehicles",  "airplane", 584003, 5),   # Airplane engine.wav
    ("animals",   "frog",     391520, 4),   # Frogs croaking.wav
    ("animals",   "monkey",   850013, 2),   # Primates - Spider Monkey Squeak
    ("animals",   "whale",    88449,  5),   # Baleines.wav (humpback whales)
    ("ambience",  "market",   378809, 3),   # cash small market.wav (cashier ambience)
    ("vehicles",  "ambulance",469412, 5),   # Ambulance siren
    # Replacements for user-flagged wrong matches (round 2):
    ("animals",   "cat",      110011, 2),   # cat meow — clean simple meow
    ("animals",   "cat_purr", 412016, 3),   # cat purring and meow
    ("nature",    "wind",     379464, 4),   # Wind1.mp3 — real wind, breeze/gust/swoosh
    ("nature",    "wind_howl",420297, 3),   # wind16.m4a — storm/wind/windy
    ("nature",    "rain",     241195, 6),   # Heavy Rain Short — real ambient rain field recording
    ("nature",    "rain_heavy",320520, 5),  # Rain (Field Recording) — clean downpour
    ("nature",    "thunder",   38244, 6),   # thunder1.wav — 24-bit loud crack thunder
    # Round 3 — replace remaining wrong matches with hand-picked IDs:
    ("animals",   "bear",     763026, 4),   # Bear Angry Growl — real bear
    ("animals",   "elephant", 507467, 4),   # Angry Elephant.aiff — real elephant
    ("animals",   "tiger",    446792, 3),   # Tigre.wav — real tiger
    ("vehicles",  "car",       50898, 4),   # Car Ignition Key - Engine Starting Running Idle
    ("vehicles",  "motorcycle",560387, 5),  # motorcycle engine — real motorbike
    ("vehicles",  "police_car",819894, 3),  # European Police siren 1
    ("vehicles",  "race_car",  659551, 4),  # Car racing past 3
    ("vehicles",  "garbage_truck",636564, 5),  # Garbage Disposal — closest CC0 to garbage truck
    ("vehicles",  "excavator", 210048, 4),  # Hammering at building site — closest CC0 to construction
    # Round 4 — replace short sounds with longer sources:
    ("animals",   "cat",       461823, 5),  # meowing_long.wav 7.9s — multiple meows
    ("animals",   "cat_meow",   66517, 4),  # meow8.wav 5.0s
    ("animals",   "dog_big",   270586, 3),  # Small Dog Barking 2.8s — multiple barks
    ("animals",   "monkey",    332724, 4),  # Howler Monkeys 4.5s
    ("household", "alarm_clock",238390, 5), # AlarmClock.wav 6.1s
    ("household", "doorbell",  709948, 3),  # Doorbell 3.3s
]


def api_get(sound_id):
    url = f"{API}/sounds/{sound_id}/?token={TOKEN}&fields=id,name,username,license,previews,duration"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def download(url, dst):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r, open(dst, "wb") as f:
        shutil.copyfileobj(r, f)


def convert(src, dst, max_dur):
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", src, "-ac", "1", "-ar", "44100", "-b:a", "128k",
        "-t", str(max_dur),
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
        dst,
    ], check=True)


def main():
    licenses = {"version": 1, "licenses": {}}
    with open("assets/LICENSES.json", encoding="utf-8") as f:
        licenses["licenses"] = json.load(f).get("licenses") or {}

    with tempfile.TemporaryDirectory() as tmpdir:
        for cat, icon, sid, max_dur in TARGETS:
            print(f"[{cat}/{icon}] -> sound #{sid}")
            try:
                meta = api_get(sid)
            except Exception as e:
                print(f"  meta fetch failed: {e}")
                continue
            preview = (meta.get("previews") or {}).get("preview-hq-mp3")
            if not preview:
                print("  no preview URL"); continue
            try:
                src = os.path.join(tmpdir, "src.mp3")
                dst = f"assets/audio/{cat}/{icon}.mp3"
                download(preview, src)
                convert(src, dst, max_dur)
                # Remove old keys
                for old in [f"freesound_{icon}", f"freesound_attr_{icon}",
                            f"commons_{icon}"]:
                    licenses["licenses"].pop(old, None)
                licenses["licenses"][f"freesound_{icon}"] = {
                    "name": meta.get("license") or "Creative Commons 0",
                    "url": f"https://freesound.org/s/{sid}/",
                    "attribution": f"{meta.get('name','')} by {meta.get('username','')}",
                }
                print(f"  -> {dst}  ({meta['name']})")
            except Exception as e:
                print(f"  fail: {e}")
            time.sleep(0.5)

    with open("assets/LICENSES.json", "w", encoding="utf-8") as f:
        json.dump(licenses, f, ensure_ascii=False, indent=2)
    print("done")


if __name__ == "__main__":
    main()
