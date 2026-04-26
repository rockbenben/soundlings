#!/usr/bin/env python3
"""For each sound, compare its source filename + Freesound tags with the
expected concept. Reports a confidence score and a list of suspect files.

This is a heuristic check (we can't actually listen). Confidence is HIGH
if expected keywords appear in name/tags, MEDIUM if related-domain words
appear, LOW if nothing matches.
"""
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

API = "https://freesound.org/apiv2"
TOKEN = os.environ.get("FREESOUND_TOKEN")
UA = "Soundlings/1.0"

# For each iconKey: (must-have keywords, related-but-not-required, hard-blocklist)
# All matched case-insensitively, on filename + tags.
EXPECT = {
    # vehicles
    "police_car":   (["police", "siren"], ["wail", "emergency"], ["ambulance", "fire truck"]),
    "ambulance":    (["ambulance", "siren"], ["emergency", "wail"], ["police", "fire truck"]),
    "fire_truck":   (["fire", "truck"], ["siren", "engine"], ["police", "ambulance"]),
    "car":          (["car", "automobile", "engine", "auto"], ["sedan", "vehicle", "motor"],
                     ["hover", "spaceship", "scifi", "sci-fi", "rocket"]),
    "bus":          (["bus", "engine", "motor"], ["transit", "diesel"],
                     ["hover", "scifi"]),
    "truck":        (["truck", "engine", "diesel"], ["motor", "lorry"],
                     ["hover", "scifi"]),
    "airplane":     (["airplane", "plane", "jet", "aircraft", "boeing"],
                     ["fly", "takeoff", "landing"], ["dropship", "rocket", "scifi", "alien"]),
    "train":        (["train", "metro", "rail"], ["whistle", "horn", "locomotive"], []),
    "subway":       (["subway", "metro", "underground", "train"], ["passing", "interior"],
                     []),
    "motorcycle":   (["motorcycle", "motorbike", "bike", "harley", "scooter"],
                     ["engine", "rev"], ["hover", "scifi"]),
    "bicycle":      (["bicycle", "bike", "bell"], ["ring", "ding"], []),
    "boat":         (["boat", "ship", "horn", "fog"], ["bassoon", "vessel"], []),
    "helicopter":   (["helicopter", "chopper", "rotor"], ["blade", "fly"], []),
    "excavator":    (["excavator", "construction", "digger", "backhoe"],
                     ["machinery", "site", "engine"], ["laser", "cutter"]),
    "garbage_truck":(["garbage", "trash", "refuse", "truck", "dump"],
                     ["dropping", "waste"], ["timber", "wood throw"]),
    "submarine":    (["submarine", "sonar", "ping"], ["ocean", "sub"], []),
    "hot_air_balloon":(["balloon", "burner", "propane"], ["flame", "gas"], []),
    "race_car":     (["race", "racing", "racecar", "formula", "f1", "auto"],
                     ["car", "engine", "rev"], ["whoosh", "zip", "flyby"]),
    "tractor":      (["tractor"], ["engine", "diesel", "farm"], []),
    "school_bus":   (["bus", "school", "horn", "honk"], [], []),
    # nature
    "wind":         (["wind"], ["breeze", "blow"], []),
    "wind_gust":    (["wind", "gust"], ["strong", "blow"], []),
    "wind_howl":    (["wind", "howl"], ["howling", "storm"], []),
    "rain":         (["rain", "rainfall"], ["wet", "shower", "hail"], ["metal sheet"]),
    "rain_light":   (["rain", "drizzle"], ["light", "soft"], []),
    "rain_heavy":   (["rain"], ["heavy", "downpour", "storm"], []),
    "thunder":      (["thunder", "thunderclap", "lightning"], ["storm", "rain"], ["metal sheet"]),
    "ocean":        (["ocean", "wave", "sea", "surf"], ["beach"], []),
    "stream":       (["stream", "river", "water", "creek", "brook"],
                     ["flow", "fishing", "hook"], []),
    "birds":        (["bird"], ["chirp", "chirping", "song"], []),
    "birds_chirp":  (["bird", "chirp", "chim", "chirping"], ["song"], []),
    "birds_song":   (["bird", "song", "singing"], ["morning", "dawn"], []),
    "insects":      (["insect", "cricket", "bug"], ["chirp", "night"], []),
    "campfire":     (["fire", "campfire", "crackling"], ["wood", "flame"], []),
    # animals
    "dog_small":    (["dog", "bark", "puppy", "small"], ["yelp"], []),
    "dog_big":      (["dog", "bark", "big", "large"], ["growl"], []),
    "dog_whine":    (["dog", "whine", "whimper", "shih tzu"], ["puppy"], []),
    "cat":          (["cat", "meow", "kitten", "twit"], ["purr"], []),
    "cat_meow":     (["cat", "meow"], ["female", "kitten"], []),
    "cat_purr":     (["cat", "purr", "purring", "twit"], [], []),
    "cow":          (["cow", "moo", "cattle", "kuh", "bulle"], ["bull"], []),
    "sheep":        (["sheep", "baa", "bleat", "lamb"], ["norwegian"], []),
    "chicken":      (["chicken", "cluck", "hen"], ["fowl"], []),
    "duck":         (["duck", "quack"], ["goose"], []),
    "pig":          (["pig", "grunt", "oink", "squeal"], ["hog"], []),
    "horse":        (["horse", "neigh", "renill", "cavall", "whinny"], ["pony"], []),
    "horse_neigh":  (["horse", "neigh", "whinny"], [], []),
    "horse_gallop": (["horse", "gallop", "hooves"], ["running"], []),
    "lion":         (["lion", "roar"], [], ["alien"]),
    "tiger":        (["tiger", "growl", "snarl"], ["roar"], ["alien", "scifi"]),
    "elephant":     (["elephant", "trumpet"], ["african", "indian"],
                     ["dinosaur", "khủng long", "khung long"]),
    "monkey":       (["monkey", "chimp", "ape", "macaque", "primate"],
                     ["howl", "chatter"], ["imitation"]),
    "bear":         (["bear", "growl", "roar"], ["grizzly", "brown"], ["imitation", "ominous"]),
    "whale":        (["whale", "humpback"], ["song", "ocean", "underwater"],
                     ["handspinner", "spinner", "toy"]),
    "frog":         (["frog", "ribbit", "croak", "bullfrog"], ["pond"], ["wooden", "instrument"]),
    # instruments
    "piano":        (["piano"], ["note", "key", "upright"], []),
    "piano_g4":     (["piano", "g4", "g3"], ["yamaha", "toy"], []),
    "piano_a4":     (["piano", "a4", "a3"], ["yamaha", "toy"], []),
    "piano_c5":     (["piano", "c"], ["upright", "remeau"], []),
    "piano_e5":     (["piano", "e"], ["upright", "remeau"], []),
    "drum":         (["drum"], ["hit", "tom", "snare"], []),
    "drum_kick":    (["kick", "drum", "bass"], [], []),
    "drum_snare":   (["snare", "drum"], ["smack"], []),
    "guitar":       (["guitar"], ["acoustic", "chord"], []),
    "xylophone":    (["xylophone", "xylo"], [], []),
    "triangle":     (["triangle", "chime"], ["bell"], []),
    "tambourine":   (["tambourine"], ["shake"], []),
    "harmonica":    (["harmonica"], ["note"], []),
    "trumpet":      (["trumpet"], ["c1", "c", "note", "horn"], []),
    "violin":       (["violin"], ["note", "string", "v0"], []),
    "shaker":       (["shaker"], ["shk", "percussion"], []),
    # household
    "doorbell":     (["doorbell", "ding", "dong"], ["bell"], []),
    "phone":        (["phone", "telephone", "ring"], ["old", "rotary"], []),
    "microwave":    (["microwave", "beep"], ["kitchen", "button"], []),
    "hair_dryer":   (["hair", "dryer", "blow dryer"], [], []),
    "alarm_clock":  (["alarm", "clock"], ["beep", "ring"], []),
    "vacuum":       (["vacuum"], ["cleaner"], []),
    "washing_machine":(["washing", "washer"], ["spin", "machine"], []),
    "kettle":       (["kettle"], ["whistle", "boil"], []),
    "knock":        (["knock", "knocking"], ["door"], []),
    "typing":       (["typing", "keyboard", "tapping"], ["keys"], []),
    # ambience
    "cafe":         (["cafe", "café", "ambience", "coffee"], ["restaurant"], []),
    "classroom":    (["classroom", "school"], ["empty", "students"], []),
    "playground":   (["playground", "children", "kids", "playing"], [], []),
    "kitchen":      (["kitchen", "cooking", "chopping"], ["restaurant"], []),
    "rainy_night":  (["rain", "night", "thunder", "donder"], ["storm"], []),
    "market":       (["market", "crowd", "vendor", "shopping"], [], ["goat", "bleeting", "bleeding"]),
    "library":      (["library", "page", "quiet", "turn"], [], []),
    "subway_car":   (["subway", "metro", "train", "underground", "interior"], ["hum", "ride"], []),
}


def grade(icon: str, name: str, tags: list[str]):
    """Return (label, reason).

    Logic: must-keyword match in the filename (most reliable signal) wins.
    Blocked words are only fatal when they appear IN THE FILENAME — tags
    can be loose-fitting and shouldn't override a clear filename match.
    """
    if icon not in EXPECT:
        return ("?", "no expectation")
    must, related, blocked = EXPECT[icon]
    name_l = name.lower()
    full = (name + " " + " ".join(tags)).lower()
    must_hits = [k for k in must if k.lower() in name_l]
    related_hits = [k for k in related if k.lower() in name_l]
    blocked_in_name = [b for b in blocked if b.lower() in name_l]
    if blocked_in_name:
        return ("❌ WRONG", f"blocked term '{blocked_in_name[0]}' in name")
    if must_hits:
        return ("✅ HIGH", f"matches {must_hits}")
    # Blocked term in tags only — flag as suspicious not wrong if no must-hit.
    blocked_in_tags = [b for b in blocked if b.lower() in full]
    if blocked_in_tags:
        return ("⚠️ MED", f"blocked term '{blocked_in_tags[0]}' in tags only")
    if related_hits:
        return ("⚠️ MED", f"only related {related_hits} in name")
    must_in_tags = [k for k in must if k.lower() in full]
    if must_in_tags:
        return ("⚠️ MED", f"keyword {must_in_tags} only in tags")
    return ("❌ LOW", f"no expected keyword in '{name}'")


def fetch_tags(sound_id: str) -> list[str]:
    if not TOKEN:
        return []
    try:
        url = f"{API}/sounds/{sound_id}/?token={TOKEN}&fields=tags"
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read().decode("utf-8"))
            return data.get("tags") or []
    except Exception:
        return []


def main():
    with open("assets/LICENSES.json", encoding="utf-8") as f:
        licenses = json.load(f)["licenses"]

    rows = []
    for cat in ["vehicles", "nature", "animals", "instruments",
                "household", "ambience"]:
        for fn in sorted(os.listdir(f"assets/audio/{cat}")):
            if not fn.endswith(".mp3"):
                continue
            icon = fn.replace(".mp3", "")
            entry = None
            url = ""
            for prefix in ("freesound_", "freesound_attr_", "commons_"):
                k = f"{prefix}{icon}"
                if k in licenses:
                    entry = licenses[k]
                    url = entry.get("url", "")
                    break
            attribution = (entry or {}).get("attribution") or "(none)"
            # Extract source name and sound id
            name_match = re.match(r"^(.+?) by ", attribution)
            source_name = name_match.group(1) if name_match else attribution
            id_match = re.search(r"/s/(\d+)/", url)
            sound_id = id_match.group(1) if id_match else None

            tags = fetch_tags(sound_id) if sound_id else []
            time.sleep(0.3 if sound_id else 0)

            label, reason = grade(icon, source_name, tags)
            rows.append((cat, icon, label, reason, source_name[:60], url))

    # Print
    print(f"{'Cat/Icon':<32} {'Grade':<10} {'Reason':<55} {'Source'}")
    print("-" * 160)
    counts = {"✅ HIGH": 0, "⚠️ MED": 0, "❌ LOW": 0, "❌ WRONG": 0, "?": 0}
    for cat, icon, label, reason, src, url in rows:
        ki = f"{cat}/{icon}"
        print(f"{ki:<32} {label:<10} {reason[:55]:<55} {src}")
        counts[label.split()[0] if " " in label else label] = counts.get(
            label.split()[0] if " " in label else label, 0) + 1

    print()
    print("Summary:")
    high = sum(1 for r in rows if "HIGH" in r[2])
    med = sum(1 for r in rows if "MED" in r[2])
    low = sum(1 for r in rows if "LOW" in r[2])
    wrong = sum(1 for r in rows if "WRONG" in r[2])
    print(f"  ✅ HIGH (definite match): {high}")
    print(f"  ⚠️  MED  (related but unsure): {med}")
    print(f"  ❌ LOW  (no expected keyword found): {low}")
    print(f"  ❌ WRONG (contains blocked term): {wrong}")

    bad = [r for r in rows if "WRONG" in r[2] or "LOW" in r[2]]
    if bad:
        print()
        print("=== Need replacement ===")
        for cat, icon, label, reason, src, url in bad:
            print(f"  {cat}/{icon}  {label}  {reason}")
            print(f"    source: {src}")
            print(f"    url:    {url}")


if __name__ == "__main__":
    main()
