/**
 * Character configuration. The hero picks, in order:
 *  0. Video clips of Kanasu's character in public/character/video/ (intro, idle, wave, spin, celebrate, laptop, contact).
 *  1. Cursor-tracking frames of Kanasu's illustration (public/character/gaze/manifest.json,
 *     made by `npm run gaze:generate`).
 *  2. Her own rigged 3D VRM at /public/models/kanasu.vrm (or NEXT_PUBLIC_CHARACTER_MODEL).
 *  3. The illustrated portrait fallback.
 * URL overrides for testing: ?model=portrait, ?model=gaze, ?model=vrm (skip video and frames), ?model=sample
 * (pixiv's generic anime VRM sample, labelled "not Kanasu", for testing the 3D pipeline only).
 */
export const CHARACTER_MODEL_URL = process.env.NEXT_PUBLIC_CHARACTER_MODEL || "/models/kanasu.vrm";

/** Video clips found by next.config.ts, e.g. { intro: "intro.mp4", idle: "idle.mp4" }. */
export const HERO_VIDEOS: Partial<Record<"intro" | "idle" | "wave" | "spin" | "celebrate" | "laptop" | "contact", string>> = Object.fromEntries(
  (process.env.NEXT_PUBLIC_HERO_VIDEOS ?? "")
    .split(",")
    .filter(Boolean)
    .map((pair) => pair.split(":") as [string, string]),
);
/** Kanasu's hero picture if present (public/character/hero.*), otherwise the original illustration. */
export const HERO_POSTER = process.env.NEXT_PUBLIC_HERO_POSTER || "/character.webp";
export const HAS_HERO_VIDEO = Boolean(HERO_VIDEOS.intro || HERO_VIDEOS.idle);
/** Clips with a transparent .webm next to the .mp4 (background removed). */
export const HERO_ALPHA_CLIPS = (process.env.NEXT_PUBLIC_HERO_ALPHA_CLIPS ?? "").split(",").filter(Boolean);
/** Transparent tracking frames in public/character/gaze/alpha/. */
export const HAS_GAZE_ALPHA = process.env.NEXT_PUBLIC_HAS_GAZE_ALPHA === "1";

/**
 * Per-clip scale/offset so every clip lines up with the tracking frames at the hand-off
 * (some clips were generated with her a little smaller or off-centre). Offsets are % of the frame.
 */
export const CLIP_FIT: Partial<Record<string, { scale: number; x: number; y: number }>> = {
  // Measured from the background-free clips: silhouette of each clip's end pose vs the tracking base.
  // The green-screen clips (intro, idle, laptop, contact) frame her a little smaller than the tracking frames.
  intro: { scale: 1.15, x: 1.6, y: 8 },
  idle: { scale: 1.09, x: 0.3, y: 6 },
  spin: { scale: 1.035, x: -0.23, y: 0.25 },
  celebrate: { scale: 1.045, x: -0.5, y: 0.85 },
  laptop: { scale: 1.1, x: 0.9, y: 6.9 },
  contact: { scale: 1.1, x: 0.75, y: 7.25 },
};

/**
 * Flat colour the Safari/iOS .mp4 clips are composited on (they can't play transparent video), painted
 * behind them too so the cursor-tracking frames sit on the same colour. Keep in sync with scripts/green_screen.py.
 */
export const PLATE = "#463a7e";

/** Set by next.config.ts when the gaze frames exist. */
export const HAS_GAZE_FRAMES = process.env.NEXT_PUBLIC_HAS_GAZE_FRAMES === "1";

/** Set by next.config.ts when the model file exists (or a custom URL is configured). */
export const HAS_CHARACTER_MODEL = process.env.NEXT_PUBLIC_HAS_CHARACTER_MODEL === "1";

export const SAMPLE_MODEL_URL = "/models/samples/vrm1-sample-pixiv.vrm";

export const GREETING_TEXT = "Hi, welcome to my universe! I'm Kanasu. Let's explore my work together.";
export const GREETING_SPEECH = GREETING_TEXT;

export const TAP_LINES = [
  "Hi there! Thanks for stopping by.",
  "Each planet around me opens a part of my work.",
  "Projects has the full case studies.",
  "Want to talk? Contact has my email and links.",
];

/** Rough talking time for a line when no audio is playing (drives the mouth animation). */
export const talkSeconds = (text: string) => Math.min(6, 0.6 + text.length * 0.055);
