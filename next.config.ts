import { existsSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

// Whether Kanasu's own VRM is present, checked at build/dev-server start so the browser
// never has to probe for it. Restart `npm run dev` after adding public/models/kanasu.vrm.
const hasCharacterModel = Boolean(process.env.NEXT_PUBLIC_CHARACTER_MODEL) || existsSync(join(process.cwd(), "public/models/kanasu.vrm"));

// Same for the cursor-tracking frames made by scripts/generate-gaze-frames.mjs.
const hasGazeFrames = existsSync(join(process.cwd(), "public/character/gaze/manifest.json"));

// Hero video clips (public/character/video/<clip>.mp4 or .webm), as "intro:intro.mp4,idle:idle.mp4".
const clips = ["intro", "idle", "wave", "spin", "celebrate", "laptop", "contact"];
const heroVideos = clips
  .map((clip) => {
    const file = ["mp4", "webm"].map((ext) => `${clip}.${ext}`).find((f) => existsSync(join(process.cwd(), "public/character/video", f)));
    return file ? `${clip}:${file}` : null;
  })
  .filter(Boolean)
  .join(",");

// Clips that also have a transparent version (<clip>.webm, made by scripts/remove_background.py
// or scripts/green_screen.py), and the transparent tracking frames. Browsers without alpha video keep the .mp4 versions.
const heroAlphaClips = clips
  .filter((clip) => existsSync(join(process.cwd(), "public/character/video", `${clip}.webm`)))
  .join(",");
const hasGazeAlpha = existsSync(join(process.cwd(), "public/character/gaze/alpha/manifest.json"));

// Kanasu's hero picture (public/character/hero.jpg|jpeg|png|webp), shown before/under the video.
const heroPoster = ["jpg", "jpeg", "png", "webp"].map((ext) => `hero.${ext}`).find((f) => existsSync(join(process.cwd(), "public/character", f)));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  env: {
    NEXT_PUBLIC_HAS_CHARACTER_MODEL: hasCharacterModel ? "1" : "",
    NEXT_PUBLIC_HAS_GAZE_FRAMES: hasGazeFrames ? "1" : "",
    NEXT_PUBLIC_HERO_VIDEOS: heroVideos,
    NEXT_PUBLIC_HERO_ALPHA_CLIPS: heroAlphaClips,
    NEXT_PUBLIC_HAS_GAZE_ALPHA: hasGazeAlpha ? "1" : "",
    NEXT_PUBLIC_HERO_POSTER: heroPoster ? `/character/${heroPoster}` : "",
  },
};

export default nextConfig;
