#!/usr/bin/env python3
"""Fetch real CC0 sounds from Freesound.org and convert to short
normalized mp3s for the seed library.

Freesound requires an API token. To get one (free):
  1. Sign up at https://freesound.org
  2. Go to https://freesound.org/apiv2/apply/
  3. Apply for an API key (auto-approved, takes seconds)
  4. Export: FREESOUND_TOKEN=<your-token>

Then run:
  python scripts/fetch_freesound.py

The script:
  - Searches Freesound with `license:"Creative Commons 0"` filter
  - Picks the top short result for each query (prefer < 6s)
  - Downloads the high-quality preview (no OAuth needed for previews)
  - Converts via ffmpeg to mono 44.1 kHz 128 kbps mp3, loudnorm to -14 LUFS,
    trimmed to <max_dur> seconds
  - Writes/merges assets/LICENSES.json with attribution
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
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

API = "https://freesound.org/apiv2"
UA = "Soundlings/1.0 (open-source sound board for kids)"

TOKEN = os.environ.get("FREESOUND_TOKEN")
if not TOKEN:
    print("ERROR: set FREESOUND_TOKEN environment variable.")
    print("Get a free key at https://freesound.org/apiv2/apply/")
    sys.exit(1)

SOUNDS = [
    # (category, iconKey, search-query, max_dur_seconds)
    # ---------- animals ----------
    ("animals", "dog_small", "small dog bark", 2),
    ("animals", "dog_big", "big dog bark", 2),
    ("animals", "dog_whine", "dog whine", 2),
    ("animals", "cat", "cat meow", 2),
    ("animals", "cat_meow", "cat meow short", 2),
    ("animals", "cat_purr", "cat purr", 3),
    ("animals", "cow", "cow moo", 3),
    ("animals", "sheep", "sheep baa", 3),
    ("animals", "chicken", "chicken cluck", 3),
    ("animals", "duck", "duck quack", 2),
    ("animals", "pig", "pig oink", 2),
    ("animals", "horse", "horse neigh", 3),
    ("animals", "horse_neigh", "horse whinny", 3),
    ("animals", "horse_gallop", "horse gallop hooves", 3),
    ("animals", "lion", "lion roar", 3),
    ("animals", "tiger", "tiger growl", 3),
    ("animals", "elephant", "elephant trumpet", 3),
    ("animals", "monkey", "monkey chimp", 3),
    ("animals", "bear", "bear growl", 3),
    ("animals", "whale", "whale song", 3),
    ("animals", "frog", "frog ribbit", 3),
    # ---------- nature ----------
    ("nature", "rain", "rain", 3),
    ("nature", "rain_light", "light rain drizzle", 3),
    ("nature", "rain_heavy", "heavy rain", 3),
    ("nature", "thunder", "thunder", 3),
    ("nature", "wind", "wind blow", 3),
    ("nature", "wind_gust", "wind gust", 3),
    ("nature", "wind_howl", "wind howl", 3),
    ("nature", "ocean", "ocean waves", 3),
    ("nature", "stream", "stream water", 3),
    ("nature", "birds", "birds chirp", 3),
    ("nature", "birds_chirp", "small bird chirp", 3),
    ("nature", "birds_song", "bird song", 3),
    ("nature", "insects", "crickets chirping", 3),
    ("nature", "campfire", "campfire crackle", 3),
    # ---------- vehicles ----------
    ("vehicles", "police_car", "police siren", 3),
    ("vehicles", "ambulance", "ambulance siren", 3),
    ("vehicles", "fire_truck", "fire truck siren", 3),
    ("vehicles", "car", "car engine idle", 3),
    ("vehicles", "bus", "city bus engine pass by", 3),
    ("vehicles", "truck", "truck engine diesel", 3),
    ("vehicles", "airplane", "airplane plane fly by", 3),
    ("vehicles", "train", "train whistle steam", 3),
    ("vehicles", "subway", "subway train", 3),
    ("vehicles", "motorcycle", "motorcycle rev", 3),
    ("vehicles", "bicycle", "bicycle bell", 2),
    ("vehicles", "boat", "boat horn", 2),
    ("vehicles", "helicopter", "helicopter flying overhead", 3),
    ("vehicles", "excavator", "construction excavator digger", 3),
    ("vehicles", "garbage_truck", "garbage truck", 3),
    ("vehicles", "submarine", "sonar ping", 2),
    ("vehicles", "hot_air_balloon", "hot air balloon burner", 3),
    ("vehicles", "race_car", "racecar engine pass by", 3),
    ("vehicles", "tractor", "tractor diesel", 3),
    ("vehicles", "school_bus", "school bus horn", 2),
    # ---------- instruments ----------
    ("instruments", "piano", "piano single note c4", 2),
    ("instruments", "piano_g4", "piano single note g4", 2),
    ("instruments", "piano_a4", "piano single note a4", 2),
    ("instruments", "piano_c5", "piano single note c5", 2),
    ("instruments", "piano_e5", "piano single note e5", 2),
    ("instruments", "drum", "drum hit single", 2),
    ("instruments", "drum_kick", "bass kick drum hit", 2),
    ("instruments", "drum_snare", "snare drum hit", 2),
    ("instruments", "guitar", "acoustic guitar chord", 2),
    ("instruments", "xylophone", "xylophone note", 2),
    ("instruments", "triangle", "triangle chime", 2),
    ("instruments", "tambourine", "tambourine shake", 2),
    ("instruments", "harmonica", "harmonica note", 2),
    ("instruments", "trumpet", "trumpet note", 2),
    ("instruments", "violin", "violin note", 2),
    ("instruments", "shaker", "shaker percussion", 2),
    # ---------- household ----------
    ("household", "doorbell", "doorbell ding dong", 2),
    ("household", "phone", "old phone ring", 3),
    ("household", "microwave", "microwave oven beep", 2),
    ("household", "hair_dryer", "hair dryer", 3),
    ("household", "alarm_clock", "alarm clock", 2),
    ("household", "vacuum", "vacuum cleaner", 3),
    ("household", "washing_machine", "washing machine spin cycle", 3),
    ("household", "kettle", "kettle whistle steam boiling", 3),
    ("household", "knock", "knock door", 2),
    ("household", "typing", "computer keyboard typing keys", 3),
    # ---------- ambience ----------
    ("ambience", "cafe", "cafe ambience", 3),
    ("ambience", "classroom", "classroom ambience", 3),
    ("ambience", "playground", "playground children", 3),
    ("ambience", "kitchen", "kitchen restaurant cooking ambience", 3),
    ("ambience", "rainy_night", "rain night ambience", 3),
    ("ambience", "market", "market crowd", 3),
    ("ambience", "library", "library page turn quiet", 3),
    ("ambience", "subway_car", "subway train interior ride", 3),
]


def api_get(path: str, params: dict) -> dict:
    qs = urllib.parse.urlencode({"token": TOKEN, **params})
    url = f"{API}{path}?{qs}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def search_cc0(query: str):
    """Find CC0 short sounds matching the query.

    Uses default text-relevance sort (`score`) which strongly prefers
    matches in the sound's name/description. `rating_desc` is too
    aggressive — it surfaces high-rated but off-topic sounds.
    """
    resp = api_get(
        "/search/text/",
        {
            "query": query,
            "filter": 'license:"Creative Commons 0" duration:[0.3 TO 6]',
            "sort": "score",
            "page_size": "8",
            "fields": "id,name,username,license,duration,previews,tags",
        },
    )
    return resp.get("results") or []


def download(url: str, dst: str, retries: int = 5):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    delay = 2
    for i in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=120) as r, open(dst, "wb") as f:
                shutil.copyfileobj(r, f)
            return
        except urllib.error.HTTPError as e:
            if e.code == 429 and i < retries - 1:
                time.sleep(delay)
                delay = min(delay * 2, 30)
                continue
            raise


def convert(src: str, dst: str, max_dur: int):
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", src,
        "-ac", "1", "-ar", "44100", "-b:a", "128k",
        "-t", str(max_dur),
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
        dst,
    ]
    subprocess.run(cmd, check=True)


def main():
    licenses = {"version": 1, "licenses": {}}
    try:
        with open("assets/LICENSES.json", "r", encoding="utf-8") as f:
            existing = json.load(f)
            licenses["licenses"] = existing.get("licenses") or {}
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    licenses["licenses"].setdefault(
        "placeholder_cc0",
        {
            "name": "CC0 1.0 Universal (Public Domain Dedication)",
            "url": "https://creativecommons.org/publicdomain/zero/1.0/",
            "attribution": "Synthesized fallback for sounds not yet sourced.",
        },
    )

    import pathlib

    def already_have(cat: str, icon: str) -> bool:
        mp3 = pathlib.Path(f"assets/audio/{cat}/{icon}.mp3")
        if not mp3.exists():
            return False
        return f"freesound_{icon}" in licenses["licenses"]

    ok = 0
    skipped = []
    with tempfile.TemporaryDirectory() as tmpdir:
        for cat, icon_key, query, max_dur in SOUNDS:
            if already_have(cat, icon_key):
                print(f"[{cat}/{icon_key}] already downloaded, skip")
                ok += 1
                continue
            print(f"[{cat}/{icon_key}] search: {query}")
            time.sleep(0.7)
            try:
                results = search_cc0(query)
            except Exception as e:
                print(f"  search failed: {e}")
                skipped.append((cat, icon_key, f"search: {e}"))
                continue
            if not results:
                print("  no CC0 results")
                skipped.append((cat, icon_key, "no results"))
                continue
            success = False
            for r in results:
                preview_url = (r.get("previews") or {}).get("preview-hq-mp3") \
                    or (r.get("previews") or {}).get("preview-lq-mp3")
                if not preview_url:
                    continue
                try:
                    src = os.path.join(tmpdir, "src.mp3")
                    dst = f"assets/audio/{cat}/{icon_key}.mp3"
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    download(preview_url, src)
                    convert(src, dst, max_dur)
                    license_key = f"freesound_{icon_key}"
                    licenses["licenses"][license_key] = {
                        "name": r.get("license") or "Creative Commons 0",
                        "url": f"https://freesound.org/s/{r['id']}/",
                        "attribution": f"{r.get('name','')} by {r.get('username','')}",
                    }
                    ok += 1
                    success = True
                    print(f"  -> {dst}  (#{r['id']} {r.get('name','')})")
                    break
                except Exception as e:
                    print(f"  try #{r.get('id')} failed: {e}")
                    continue
                finally:
                    time.sleep(0.5)
            if not success:
                skipped.append((cat, icon_key, "all candidates failed"))

    with open("assets/LICENSES.json", "w", encoding="utf-8") as f:
        json.dump(licenses, f, ensure_ascii=False, indent=2)

    print()
    print(f"Downloaded & converted: {ok}/{len(SOUNDS)}")
    if skipped:
        print("Skipped (fallback to synthesized or Commons):")
        for cat, icon, reason in skipped:
            print(f"  {cat}/{icon} — {reason}")


if __name__ == "__main__":
    main()
