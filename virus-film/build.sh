#!/usr/bin/env bash
# Полная сборка: ./build.sh [sub=2] [out=virus_mission.mp4]
set -e; cd "$(dirname "$0")"
SUB=${1:-2}; OUT=${2:-virus_mission.mp4}; FR=3000; W=4; TMP=${TMPDIR:-/tmp}/virus_build; mkdir -p "$TMP"; rm -f "$TMP"/seg*.mp4
node dump_events.js && python3 audio.py
for k in $(seq 0 $((W-1))); do a=$((FR*k/W)); b=$((FR*(k+1)/W)); node render.js $a $b $SUB "$TMP/seg$k.mp4" > "$TMP/log$k.txt" 2>&1 & PIDS="$PIDS $!"; done
for p in $PIDS; do wait $p || { echo "render worker failed, see $TMP/log*.txt"; exit 1; }; done
: > "$TMP/list.txt"; for k in $(seq 0 $((W-1))); do echo "file '$TMP/seg$k.mp4'" >> "$TMP/list.txt"; done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$TMP/list.txt" -i audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart "$OUT"
echo done "$OUT"
