"""
FREE version of the cursor-tracking frame generator.

Uses the public Hugging Face Space "fffiloni/expression-editor" (LivePortrait, free shared GPU)
instead of Replicate. Same frames and settings as scripts/generate-gaze-frames.mjs.

Setup (once):
    python -m pip install --user gradio_client pillow

Run from the portfolio folder:
    python scripts/generate_gaze_frames_free.py

Notes:
- Free GPU time on Hugging Face is limited per day. If you hit the limit, just run the command
  again later: frames that already exist are skipped. Logging in with a free Hugging Face token
  gives more free time:  $env:HF_TOKEN = "hf_..."  (https://huggingface.co/settings/tokens)
- Your picture is uploaded to a public Hugging Face Space for processing.
"""

import os
import subprocess
import sys
import time
from pathlib import Path

try:
    from gradio_client import Client, handle_file
    from PIL import Image
except ImportError:
    sys.exit("Missing packages. Run:  python -m pip install --user gradio_client pillow")

ROOT = Path.cwd()
OUT = ROOT / "public" / "character" / "gaze"
SPACE = "fffiloni/expression-editor"
COLS, ROWS = 7, 5
SOURCES = [ROOT / "character-gaze-source.png", ROOT / "character-reference.png", ROOT / "public" / "character.webp"]


def cell_dir(c, r):
    return (c / (COLS - 1)) * 2 - 1, (r / (ROWS - 1)) * 2 - 1


def look_params(gx, gy):
    # Same as the Replicate script: pupils lead, the head follows.
    return dict(rotate_yaw=round(gx * 16, 1), rotate_pitch=round(gy * 10, 1), pupil_x=round(gx * 11, 1), pupil_y=round(gy * 7, 1))


EXTRAS = {
    "blink": dict(blink=-14),
    "smile": dict(smile=1.0, eyebrow=2),
    "talkA": dict(aaa=45, smile=0.25),
    "talkO": dict(woo=12, aaa=15),
    "talkE": dict(eee=12, smile=0.3),
}


def run(client, image, p):
    return client.predict(
        handle_file(str(image)),
        p.get("rotate_pitch", 0),
        p.get("rotate_yaw", 0),
        p.get("rotate_roll", 0),
        p.get("blink", 0),
        p.get("eyebrow", 0),
        p.get("wink", 0),
        p.get("pupil_x", 0),
        p.get("pupil_y", 0),
        p.get("aaa", 0),
        p.get("eee", 0),
        p.get("woo", 0),
        p.get("smile", 0),
        1,  # src ratio
        1,  # sample ratio
        "OnlyExpression",
        1.7,  # crop factor
        api_name="/edit_expression_2",
    )


def save(result_path, name):
    img = Image.open(result_path).convert("RGB")
    if img.width > 1280:
        img = img.resize((1280, round(img.height * 1280 / img.width)), Image.LANCZOS)
    img.save(OUT / name, "WEBP", quality=80)


def main():
    source = next((s for s in SOURCES if s.exists()), None)
    if not source:
        sys.exit("No source picture found (expected character-gaze-source.png in the portfolio folder).")
    print(f"Source picture: {source}")
    OUT.mkdir(parents=True, exist_ok=True)

    jobs = [(f"r{r}c{c}.webp", look_params(*cell_dir(c, r))) for r in range(ROWS) for c in range(COLS)]
    jobs += [(f"{k}.webp", v) for k, v in EXTRAS.items()]
    todo = [(n, p) for n, p in jobs if not (OUT / n).exists()]
    print(f"{len(jobs) - len(todo)} frames already made, {len(todo)} to go.")

    token = os.environ.get("HF_TOKEN") or None
    try:
        client = Client(SPACE, token=token, verbose=False)
    except TypeError:  # gradio_client < 1.4 calls it hf_token
        client = Client(SPACE, hf_token=token, verbose=False)
    for i, (name, params) in enumerate(todo, 1):
        for attempt in range(1, 4):
            try:
                save(run(client, source, params), name)
                print(f"  {i}/{len(todo)} {name}")
                break
            except Exception as e:  # the Space reports quota and queue problems as generic errors
                msg = str(e)
                low = msg.lower()
                if "quota" in low or ("gpu" in low and "limit" in low):
                    sys.exit(
                        f"\nFree GPU limit reached after {i - 1} new frames. They are saved.\n"
                        "Run the same command again later (or set HF_TOKEN for more free time) to continue."
                    )
                if attempt == 3:
                    sys.exit(f"\n{name} failed: {msg}\nRun the command again to retry; finished frames are kept.")
                print(f"  retrying {name} ({msg[:80]})")
                time.sleep(5 * attempt)

    subprocess.run(["node", "scripts/generate-gaze-frames.mjs", "--only-manifest"], check=True)
    print("Done. Restart `npm run dev` to see her follow the cursor.")


if __name__ == "__main__":
    main()
