"""
Turns green-screen clips of Kanasu into the files the hero uses (no AI model needed, unlike remove_background.py).

For each media/green/<clip>.mp4 it writes, with the original audio:
  public/character/video/<clip>.webm   VP9 with transparency (Chrome, Edge, Firefox, Android)
  public/character/video/<clip>.mp4    the same clip on a flat PLATE colour (Safari and iOS, which can't
                                       play transparent video; VideoCharacter paints the same colour behind it)
Clips that only have a transparent .webm (made earlier by remove_background.py) also get a PLATE .mp4,
so every clip looks the same in Safari. Their original room .mp4 is kept in media/room/ first.

Setup (once):  pip install imageio-ffmpeg numpy
Run from the portfolio folder:
    python scripts/green_screen.py               # every clip in media/green/, then the PLATE .mp4s
    python scripts/green_screen.py intro contact  # only these green clips
"""

import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path.cwd()
GREEN = ROOT / "media" / "green"
ROOM = ROOT / "media" / "room"
VIDEO = ROOT / "public" / "character" / "video"
CLIPS = ["intro", "idle", "wave", "spin", "celebrate", "laptop", "contact"]
# Keep in sync with PLATE in components/character/config.ts.
PLATE = np.array([0x46, 0x3A, 0x7E], np.float32)
# The video generator's sparkle watermark (x0, y0, x1, y1 at 1280x720); keyed out more aggressively there.
WATERMARK = (1128, 568, 1192, 632)

WEBM = ["-b:v", "0", "-crf", "34", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4"]
MP4 = ["-crf", "23", "-preset", "slow", "-movflags", "+faststart"]


def read(src: Path, alpha=False):
    """Yields (meta, frames) where frames are HxWx3 (or x4) uint8 arrays."""
    # libvpx is needed to decode a VP9 alpha channel; ffmpeg's built-in decoder drops it.
    params = ["-c:v", "libvpx-vp9"] if alpha else None
    reader = imageio_ffmpeg.read_frames(str(src), pix_fmt="rgba" if alpha else "rgb24", bpp=4 if alpha else 3, input_params=params)
    meta = next(reader)
    w, h = meta["size"]
    c = 4 if alpha else 3
    return meta, reader, (h, w, c)


def has_audio(path: Path) -> bool:
    probe = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    return bool(re.search(r"Stream #\S+.*Audio:", probe.stderr))


def writer(dst: Path, meta, rgba: bool, audio: Path):
    w, h = meta["size"]
    out = imageio_ffmpeg.write_frames(
        str(dst),
        (w, h),
        pix_fmt_in="rgba" if rgba else "rgb24",
        pix_fmt_out="yuva420p" if rgba else "yuv420p",
        fps=meta["fps"],
        codec="libvpx-vp9" if rgba else "libx264",
        macro_block_size=1 if rgba else 16,
        # A copy: write_frames appends its audio options to the list it is given.
        output_params=list(WEBM if rgba else MP4),
        audio_path=str(audio) if has_audio(audio) else None,
        audio_codec="libopus" if rgba else "aac",
    )
    out.send(None)
    return out


def key_color(src: Path) -> np.ndarray:
    """Median of the frame borders over the clip: the green, before she walks across any edge."""
    meta, reader, shape = read(src)
    rings = []
    try:
        for i, buf in enumerate(reader):
            if i % 12:
                continue
            f = np.frombuffer(buf, np.uint8).reshape(shape)
            rings += [f[:16, :, :].reshape(-1, 3), f[:, :16].reshape(-1, 3), f[:, -16:].reshape(-1, 3)]
    finally:
        reader.close()
    return np.median(np.concatenate(rings), 0).astype(np.float32)


def key(frame: np.ndarray, excess_bg: float) -> np.ndarray:
    """Green-dominance key: how much greener a pixel is than its red/blue decides how transparent it is."""
    f = frame.astype(np.float32)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    excess = g - np.maximum(r, b)
    # Below 25% of the backdrop's green excess is fully her; above 60% is fully backdrop.
    a = 1 - np.clip((excess - 0.25 * excess_bg) / (0.35 * excess_bg), 0, 1)
    x0, y0, x1, y1 = WATERMARK
    wm = f[y0:y1, x0:x1]
    whitish = (wm.min(2) > 120) & (wm.max(2) - wm.min(2) < 50)
    a[y0:y1, x0:x1][whitish | (excess[y0:y1, x0:x1] > 0.08 * excess_bg)] = 0
    a[a < 0.04] = 0
    a[a > 0.96] = 1
    # Despill: nothing on her is green, so any green cast (hair edges, skin) is the backdrop bleeding through.
    f[..., 1] = np.minimum(g, np.maximum(r, b))
    return np.dstack([f, a[..., None] * 255]).round().astype(np.uint8)


def on_plate(rgba: np.ndarray) -> np.ndarray:
    a = rgba[..., 3:4].astype(np.float32) / 255
    return (rgba[..., :3] * a + PLATE * (1 - a)).round().astype(np.uint8)


def key_clip(clip: str):
    src = GREEN / f"{clip}.mp4"
    kc = key_color(src)
    excess_bg = float(kc[1] - max(kc[0], kc[2]))
    meta, reader, shape = read(src)
    webm = writer(VIDEO / f"{clip}.webm", meta, True, src)
    mp4 = writer(VIDEO / f"{clip}.mp4", meta, False, src)
    n = 0
    try:
        for buf in reader:
            rgba = key(np.frombuffer(buf, np.uint8).reshape(shape), excess_bg)
            webm.send(rgba)
            mp4.send(on_plate(rgba))
            n += 1
    finally:
        reader.close()
        webm.close()
        mp4.close()
    return n


def plate_from_webm(clip: str):
    """Safari version of a clip that only exists as a transparent .webm plus a room .mp4."""
    room = ROOM / f"{clip}.mp4"
    if not room.exists():
        ROOM.mkdir(parents=True, exist_ok=True)
        shutil.copy2(VIDEO / f"{clip}.mp4", room)
    webm = VIDEO / f"{clip}.webm"
    meta, reader, shape = read(webm, alpha=True)
    mp4 = writer(VIDEO / f"{clip}.mp4", meta, False, room)
    n = 0
    try:
        for buf in reader:
            mp4.send(on_plate(np.frombuffer(buf, np.uint8).reshape(shape)))
            n += 1
    finally:
        reader.close()
        mp4.close()
    return n


def main():
    wanted = sys.argv[1:] or [c for c in CLIPS if (GREEN / f"{c}.mp4").exists()]
    for clip in wanted:
        if not (GREEN / f"{clip}.mp4").exists():
            print(f"skip {clip}: no media/green/{clip}.mp4")
            continue
        t = time.time()
        n = key_clip(clip)
        print(f"{clip}: keyed {n} frames in {time.time() - t:.0f}s", flush=True)
    if not sys.argv[1:]:
        for clip in CLIPS:
            if (GREEN / f"{clip}.mp4").exists() or not (VIDEO / f"{clip}.webm").exists():
                continue
            t = time.time()
            n = plate_from_webm(clip)
            print(f"{clip}: Safari .mp4 from the transparent clip, {n} frames in {time.time() - t:.0f}s", flush=True)
    print("All done. Restart npm run dev so the site picks up new clips.")


if __name__ == "__main__":
    main()
