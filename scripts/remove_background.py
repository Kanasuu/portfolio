"""
Cuts Kanasu out of the hero videos and cursor-tracking frames, so she stands directly on the page.

For green-screen clips use scripts/green_screen.py instead (sources in media/green/); don't run this script on those,
since their .mp4 in public/ is already composited for Safari.

Uses Robust Video Matting (github.com/PeterL1n/RobustVideoMatting, loaded with torch.hub) on the CPU.
Writes, next to the originals (which stay as the fallback for browsers without alpha video, e.g. Safari):
  public/character/video/<clip>.webm      VP9 video with transparency (+ the original audio)
  public/character/gaze/alpha/            tracking base + patches with transparency, manifest.json

Setup (once), e.g. in a virtual environment:
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
    pip install imageio-ffmpeg pillow numpy
Run from the portfolio folder:
    python scripts/remove_background.py            # all clips + tracking frames
    python scripts/remove_background.py spin laptop  # only these clips (no frames)
"""

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

import imageio_ffmpeg
import numpy as np
import torch
from PIL import Image

ROOT = Path.cwd()
VIDEO = ROOT / "public" / "character" / "video"
GAZE = ROOT / "public" / "character" / "gaze"
CLIPS = ["intro", "idle", "wave", "spin", "laptop", "celebrate"]
DOWNSAMPLE = 0.4  # RVM's recommended ratio for ~720p input
FEATHER = 16  # px: patch edges blend into the base matte so seams don't show


def load_model():
    torch.set_num_threads(os.cpu_count() or 4)
    return torch.hub.load("PeterL1n/RobustVideoMatting", "mobilenetv3", trust_repo=True).eval()


def to_tensor(rgb: np.ndarray) -> torch.Tensor:
    return torch.from_numpy(rgb).permute(2, 0, 1).float().div(255).unsqueeze(0)


def to_rgba(fgr: torch.Tensor, pha: torch.Tensor) -> np.ndarray:
    # contiguous(): permute only changes strides, and ffmpeg needs the bytes in row order.
    return torch.cat([fgr, pha], 1)[0].permute(1, 2, 0).mul(255).round().clamp(0, 255).byte().contiguous().numpy()


def has_audio(path: Path) -> bool:
    probe = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    return bool(re.search(r"Stream #\S+.*Audio:", probe.stderr))


def matte_video(model, src: Path, dst: Path):
    reader = imageio_ffmpeg.read_frames(str(src))
    meta = next(reader)
    w, h = meta["size"]
    writer = imageio_ffmpeg.write_frames(
        str(dst),
        (w, h),
        pix_fmt_in="rgba",
        pix_fmt_out="yuva420p",
        fps=meta["fps"],
        codec="libvpx-vp9",
        macro_block_size=1,
        output_params=["-b:v", "0", "-crf", "34", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4"],
        audio_path=str(src) if has_audio(src) else None,
        audio_codec="libopus",
    )
    writer.send(None)
    rec = [None] * 4
    n = 0
    try:
        with torch.inference_mode():
            for buf in reader:
                frame = np.frombuffer(buf, dtype=np.uint8).reshape(h, w, 3).copy()
                fgr, pha, *rec = model(to_tensor(frame), *rec, DOWNSAMPLE)
                writer.send(to_rgba(fgr, pha))
                n += 1
                if n % 24 == 0:
                    print(f"  {src.stem}: {n} frames", flush=True)
    finally:
        writer.close()
        reader.close()
    return n


def matte_image(model, rgb: np.ndarray) -> np.ndarray:
    """Single picture: run a few passes so the recurrent state settles."""
    rec = [None] * 4
    t = to_tensor(rgb)
    with torch.inference_mode():
        for _ in range(4):
            fgr, pha, *rec = model(t, *rec, DOWNSAMPLE)
    return to_rgba(fgr, pha).astype(np.float32)


def matte_frames(model):
    manifest = json.loads((GAZE / "manifest.json").read_text())
    if not manifest.get("base") or not manifest.get("patch"):
        sys.exit("gaze/manifest.json has no base/patch; pack the frames with scripts/pack_gaze_frames.py first.")
    out = GAZE / "alpha"
    out.mkdir(exist_ok=True)
    p = manifest["patch"]
    x, y, w, h = p["x"], p["y"], p["w"], p["h"]

    base = np.array(Image.open(GAZE / manifest["base"]).convert("RGB"))
    base_rgba = matte_image(model, base)
    Image.fromarray(base_rgba.astype(np.uint8), "RGBA").save(out / manifest["base"], "WEBP", quality=85, alpha_quality=90)
    base_crop = base_rgba[y : y + h, x : x + w]

    # 1 inside the patch, fading to 0 at its edges: the patch matte takes over from the base matte smoothly.
    ramp = lambda n: np.minimum(np.arange(n), np.arange(n)[::-1]).clip(0, FEATHER) / FEATHER
    weight = np.minimum.outer(ramp(h), ramp(w))[..., None].astype(np.float32)

    names = [n for row in manifest["frames"] for n in row] + list(manifest["extras"].values())
    t0 = time.time()
    for i, name in enumerate(names, 1):
        full = base.copy()
        full[y : y + h, x : x + w] = np.array(Image.open(GAZE / name).convert("RGB"))
        crop = matte_image(model, full)[y : y + h, x : x + w]
        mixed = crop * weight + base_crop * (1 - weight)
        Image.fromarray(mixed.round().clip(0, 255).astype(np.uint8), "RGBA").save(out / name, "WEBP", quality=85, alpha_quality=90)
        if i % 10 == 0 or i == len(names):
            print(f"  frames {i}/{len(names)} ({time.time() - t0:.0f}s)", flush=True)
    (out / "manifest.json").write_text(json.dumps({**manifest, "alpha": True}, indent=2))


def main():
    wanted = sys.argv[1:] or CLIPS
    model = load_model()
    for clip in wanted:
        src = VIDEO / f"{clip}.mp4"
        if not src.exists():
            print(f"skip {clip}: no {src.name}")
            continue
        t = time.time()
        n = matte_video(model, src, VIDEO / f"{clip}.webm")
        print(f"{clip}.webm: {n} frames in {time.time() - t:.0f}s", flush=True)
    if not sys.argv[1:]:
        print("Tracking frames:", flush=True)
        matte_frames(model)
    print("All done.")


if __name__ == "__main__":
    try:
        main()
    except BaseException:
        # Keep the full error in a file too; long tracebacks scroll out of the terminal.
        import traceback

        log = ROOT / "scripts" / "remove_background.log"
        log.write_text(traceback.format_exc())
        print(f"\nFailed. Details saved to {log}")
        raise
