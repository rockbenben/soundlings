#!/usr/bin/env bash
# Re-encode every sound file in assets/audio/ for kid-app loudness:
#  - High-pass at 80 Hz: removes inaudible/distorting bass on phone speakers
#  - Mild compression: tames spikes so quiet parts come up
#  - Loudnorm to -10 LUFS (broadcast-loud, ~4 dB louder than -14)
#  - Mono 44.1kHz 128k mp3
#
# Run: bash scripts/normalize_loudness.sh
set -e

count=0
total=$(find assets/audio -name "*.mp3" | wc -l)
for src in $(find assets/audio -name "*.mp3"); do
  count=$((count + 1))
  tmp="${src}.tmp.mp3"
  ffmpeg -hide_banner -loglevel error -y -i "$src" \
    -ac 1 -ar 44100 -b:a 128k \
    -af "highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=10:release=200,loudnorm=I=-10:TP=-1.0:LRA=8" \
    "$tmp" && mv "$tmp" "$src"
  printf "\r[%d/%d] %s" "$count" "$total" "$src"
done
echo ""
echo "normalized $count files"
