"""An original, royalty-free soundtrack for the ThermoStat demo video, synthesised from scratch (stdlib only).

120 BPM, A minor: four-on-the-floor kick, claps on 2 and 4, off-beat hats, a plucked bass line and warm pad chords
(Am, F, C, G). Writes a 44.1 kHz stereo WAV.

    python3 scripts/video/compose-music.py OUT.wav [seconds]
"""
from __future__ import annotations

import math
import random
import struct
import sys
import wave
from array import array

SR = 44_100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
rnd = random.Random(20261101)


def note(n: str) -> float:
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    pitch, octave = n[:-1], int(n[-1])
    return 440.0 * 2 ** ((names[pitch] + 12 * (octave - 4)) / 12)


CHORDS = [  # one bar each
    ["A3", "C4", "E4", "A4"],
    ["F3", "A3", "C4", "F4"],
    ["C3", "E3", "G3", "C4"],
    ["G3", "B3", "D4", "G4"],
]
BASS = ["A1", "F1", "C2", "G1"]


def render(seconds: float) -> tuple[array, array]:
    n = int(seconds * SR)
    left = array("f", [0.0]) * n
    right = array("f", [0.0]) * n

    def add(start: float, samples: list[float], gain: float, pan: float = 0.0) -> None:
        i0 = int(start * SR)
        gl = gain * math.cos((pan + 1) * math.pi / 4)
        gr = gain * math.sin((pan + 1) * math.pi / 4)
        for k, v in enumerate(samples):
            i = i0 + k
            if i >= n:
                break
            left[i] += v * gl
            right[i] += v * gr

    # one-shot instruments, rendered once
    kick = []
    for k in range(int(0.32 * SR)):
        t = k / SR
        f = 45 + 95 * math.exp(-t * 28)
        kick.append(math.sin(2 * math.pi * f * t + 0.0) * math.exp(-t * 9))
    clap = []
    prev = 0.0
    for k in range(int(0.18 * SR)):
        t = k / SR
        w = rnd.uniform(-1, 1)
        hp = w - prev
        prev = w
        env = math.exp(-t * 22) * (1.0 if t > 0.012 or (k // 250) % 2 == 0 else 0.4)
        clap.append(hp * env * 0.6)
    hat = []
    prev = 0.0
    for k in range(int(0.05 * SR)):
        w = rnd.uniform(-1, 1)
        hp = w - prev
        prev = w
        hat.append(hp * math.exp(-k / SR * 70) * 0.5)

    def pluck(freq: float, dur: float) -> list[float]:
        out = []
        for k in range(int(dur * SR)):
            t = k / SR
            ph = (freq * t) % 1.0
            saw = 2 * ph - 1
            tone = 0.6 * saw + 0.4 * math.sin(2 * math.pi * freq * t)
            out.append(tone * math.exp(-t * 7) * min(1.0, t * 400))
        return out

    def pad(freqs: list[float], dur: float) -> list[float]:
        out = []
        detune = [0.997, 1.0, 1.003]
        for k in range(int(dur * SR)):
            t = k / SR
            v = 0.0
            for f in freqs:
                for d in detune:
                    v += math.sin(2 * math.pi * f * d * t)
            env = min(1.0, t / 0.35) * min(1.0, (dur - t) / 0.4)
            out.append(v / (len(freqs) * len(detune)) * env)
        return out

    bars = int(math.ceil(seconds / BAR))
    for b in range(bars):
        t0 = b * BAR
        ci = b % 4
        intro = b == 0
        add(t0, pad([note(x) for x in CHORDS[ci]], BAR), 0.22, 0.0)
        if intro:
            continue
        for beat in range(4):
            add(t0 + beat * BEAT, kick, 0.9)
            if beat in (1, 3):
                add(t0 + beat * BEAT, clap, 0.45, 0.1)
            add(t0 + beat * BEAT + BEAT / 2, hat, 0.35, -0.3)
            add(t0 + beat * BEAT + BEAT * 0.75, hat, 0.18, 0.3)
        bassline = [0, 0, 1, 0, 0, 1, 0, 1]
        for e in range(8):
            f = note(BASS[ci]) * (2 if bassline[e] else 1)
            add(t0 + e * BEAT / 2, pluck(f, BEAT / 2 * 0.9), 0.32, 0.0)
        # a light arpeggio on top from bar 3
        if b >= 2:
            arp = CHORDS[ci]
            for e in range(8):
                f = note(arp[e % 4]) * 2
                add(t0 + e * BEAT / 2, pluck(f, 0.2), 0.08, 0.35 if e % 2 else -0.35)

    # master: fade in, fade out, soft clip
    fade_in, fade_out = 0.6, 1.8
    for i in range(n):
        t = i / SR
        g = min(1.0, t / fade_in) * min(1.0, (seconds - t) / fade_out)
        left[i] = math.tanh(left[i] * g * 0.9)
        right[i] = math.tanh(right[i] * g * 0.9)
    return left, right


def main() -> int:
    out = sys.argv[1]
    seconds = float(sys.argv[2]) if len(sys.argv) > 2 else 22.0
    left, right = render(seconds)
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = bytearray()
        for a, b in zip(left, right):
            frames += struct.pack("<hh", int(max(-1, min(1, a)) * 32000), int(max(-1, min(1, b)) * 32000))
        w.writeframes(bytes(frames))
    print(f"wrote {out}: {seconds:.1f} s, {BPM} BPM")
    return 0


if __name__ == "__main__":
    sys.exit(main())
