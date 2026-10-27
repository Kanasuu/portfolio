"use client";

import { useReducedMotion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supportsAlphaVideo } from "@/lib/alphaVideo";
import { onCharacterReaction } from "@/lib/characterEvents";
import { CLIP_FIT, GREETING_TEXT, HAS_GAZE_ALPHA, HAS_GAZE_FRAMES, HERO_ALPHA_CLIPS, HERO_POSTER, PLATE, TAP_LINES } from "./config";
import Decor from "./Decor";
import { GazeFrames } from "./GazeCharacter";
import SpeechBubble from "./SpeechBubble";
import type { CharacterPointer } from "./useCharacterPointer";
import { useGazeFrames } from "./useGazeFrames";

export type Clip = "intro" | "idle" | "wave" | "spin" | "celebrate" | "laptop" | "contact";
export type Clips = Partial<Record<Clip, string>>;

const BASE = "/character/video/";

/** Lines a clip up with the tracking frames (see CLIP_FIT). */
const fitStyle = (clip: Clip): React.CSSProperties | undefined => {
  const f = CLIP_FIT[clip];
  return f ? { transform: `translate(${f.x}%, ${f.y}%) scale(${f.scale})`, transformOrigin: "50% 100%" } : undefined;
};
const INTRO_SEEN_KEY = "kanasu:intro-seen";
/** Seconds skipped at the start of the intro (it opens empty, then she walks in). */
const INTRO_START = 0;
/** Point in the intro (fraction of its length) where she has knocked and starts saying hi; the greeting bubble appears. */
const GREET_AT = 0.37;

/**
 * Hero character driven by pre-rendered video clips of Kanasu's character
 * (public/character/video/): `intro` plays once per session (walk in, wave, say hi, knock on the screen),
 * clicks alternate between `wave` and `spin`, and the page can ask for other clips (see characterEvents).
 * Between clips she follows the cursor using the gaze frames (made from the idle clip's first frame,
 * the pose the other clips start and end on); without frames, `idle` loops instead.
 * In the open variant, browsers with alpha video get the background-free clips and frames; the rest (Safari, iOS)
 * get clips composited on PLATE, with the background-free frames drawn over the same colour.
 */
export default function VideoCharacter({
  pointer,
  targetRef,
  clips: allClips,
  variant = "framed",
}: {
  pointer: CharacterPointer;
  targetRef: React.RefObject<HTMLDivElement | null>;
  clips: Clips;
  /** "framed": arch card with decor. "open": no frame, edges fade into the page, sized by the parent. */
  variant?: "framed" | "open";
}) {
  const open = variant === "open";
  const reduce = useReducedMotion() ?? false;
  // Background-free mode needs transparent clips, and transparent frames too if there are frames.
  // (This component only mounts on the client, so reading the browser here is safe.)
  const [alpha] = useState(() => open && HERO_ALPHA_CLIPS.length > 0 && (HAS_GAZE_ALPHA || !HAS_GAZE_FRAMES) && supportsAlphaVideo());
  // Without the background, only clips with a transparent version can play (an .mp4 would show the room).
  const clips = useMemo<Clips>(
    () => (alpha ? Object.fromEntries(Object.entries(allClips).filter(([c]) => HERO_ALPHA_CLIPS.includes(c))) : allClips),
    [alpha, allClips],
  );
  const videos = useRef<Partial<Record<Clip, HTMLVideoElement | null>>>({});
  const [active, setActive] = useState<Clip | null>(null);
  // True while the cursor-tracking frames are showing instead of a video.
  const [tracking, setTracking] = useState(false);
  // Without alpha video the .mp4 clips sit on PLATE, so the open variant still uses the background-free frames, over PLATE.
  const plate = open && !alpha && HAS_GAZE_ALPHA;
  const gaze = useGazeFrames({ pointer, reduce, enabled: HAS_GAZE_FRAMES, alpha: alpha || plate });
  const introPending = useRef(false);
  const [muted, setMuted] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  // The picture is hidden while the intro starts (the intro opens on an empty room, so showing her
  // first would flash). It shows for the idle start, reduced motion, or if autoplay is blocked.
  const [poster, setPoster] = useState(false);
  const activeRef = useRef<Clip | null>(null);
  const greeted = useRef(false);
  const hideTimer = useRef<number | undefined>(undefined);
  const tapIndex = useRef(0);

  const say = useCallback((text: string, ms: number) => {
    window.clearTimeout(hideTimer.current);
    setMessage(text);
    hideTimer.current = window.setTimeout(() => setMessage(null), ms);
  }, []);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  /** Starts `clip` from the beginning and cross-fades to it once it is actually playing. */
  const play = useCallback(
    (clip: Clip) => {
      const v = videos.current[clip];
      if (!v) return;
      v.currentTime = clip === "intro" ? INTRO_START : 0;
      v.muted = muted;
      v.play()
        .then(() => {
          const prev = activeRef.current;
          activeRef.current = clip;
          setActive(clip);
          setTracking(false);
          if (prev && prev !== clip) window.setTimeout(() => videos.current[prev]?.pause(), 300);
        })
        .catch(() => {
          // Autoplay blocked (e.g. data saver): show the picture instead.
          setPoster(true);
        });
    },
    [muted],
  );

  // Start: intro on the first visit this session, otherwise straight to the idle loop.
  // With reduced motion nothing autoplays; the first frame of the idle clip (or the illustration) shows.
  useEffect(() => {
    if (reduce) return setPoster(true);
    let seen = false;
    try {
      seen = Boolean(window.sessionStorage.getItem(INTRO_SEEN_KEY));
    } catch {}
    if (new URLSearchParams(window.location.search).has("greet")) seen = false;
    const first: Clip | null = clips.intro && !seen ? "intro" : clips.idle ? "idle" : clips.intro ? "intro" : null;
    if (first !== "intro") setPoster(true);
    introPending.current = first === "intro";
    if (first) play(first);
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause while the hero is off screen; resume when it comes back.
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      const v = activeRef.current ? videos.current[activeRef.current] : null;
      if (!v) return;
      if (entry.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [targetRef]);

  const onIntroTime = () => {
    const v = videos.current.intro;
    if (!v || greeted.current || !v.duration) return;
    if (v.currentTime >= v.duration * GREET_AT) {
      greeted.current = true;
      try {
        window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch {}
      say(GREETING_TEXT, 6500);
    }
  };

  /** Hands over from video to cursor tracking (or the idle loop when there are no frames). */
  const settle = useCallback(() => {
    if (gaze.ready) {
      const prev = activeRef.current;
      activeRef.current = null;
      setTracking(true);
      if (prev) window.setTimeout(() => videos.current[prev]?.pause(), 300);
    } else if (clips.idle) play("idle");
  }, [gaze.ready, clips.idle, play]);

  // Frames finished loading while the idle loop (or nothing) was showing: start tracking.
  // With reduced motion this shows the still, front-facing frame instead of the picture.
  useEffect(() => {
    if (gaze.ready && !introPending.current && (activeRef.current === "idle" || activeRef.current === null)) settle();
  }, [gaze.ready, settle]);

  const onEnded = (clip: Clip) => {
    if (clip === "intro") introPending.current = false;
    if (clip !== "idle") settle();
  };

  const sayHi = () => {
    const tap = tapIndex.current++;
    say(TAP_LINES[tap % TAP_LINES.length], 4200);
    if (reduce) return;
    // Alternate wave and spin when both exist.
    const reaction = clips.wave && clips.spin ? (tap % 2 === 0 ? "wave" : "spin") : clips.wave ? "wave" : clips.spin ? "spin" : null;
    if (reaction) play(reaction);
    else if (clips.intro && !clips.idle) play("intro");
  };

  // Reactions requested by the page (e.g. spinning when Projects opens).
  useEffect(
    () =>
      onCharacterReaction(({ clip, line }) => {
        if (line) say(line, 4200);
        if (reduce || !clip) return;
        // A clip that isn't available (e.g. no transparent version yet) falls back to a wave.
        const c = clips[clip] ? clip : clips.wave ? "wave" : null;
        if (c) play(c);
      }),
    [say, reduce, clips, play],
  );

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    for (const v of Object.values(videos.current)) if (v) v.muted = next;
  };

  const dismiss = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    setMessage(null);
  }, []);

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message, dismiss]);

  const order: Clip[] = ["intro", "idle", "wave", "spin", "celebrate", "laptop", "contact"];

  return (
    <div className={open ? "relative size-full" : "relative mx-auto w-full max-w-[17rem] sm:max-w-[22rem] lg:max-w-[25rem]"}>
      {!open && <Decor pointer={pointer} />}
      <SpeechBubble
        message={message}
        onDismiss={dismiss}
        className={open ? "inset-x-0 top-[1%] justify-center" : undefined}
      />

      <div ref={targetRef} className={open ? "relative size-full" : "relative"}>
        <button
          type="button"
          onClick={sayHi}
          aria-label="Say hi to Kanasu"
          className={
            !open
              ? "arch pointer-events-auto relative block aspect-[4/5] w-full cursor-pointer overflow-hidden border-[6px] border-white/85 bg-lilac shadow-[var(--shadow-lift)] focus-visible:outline-offset-[6px]"
              : alpha
                ? // Background removed: only the waist cut at the bottom needs to fade.
                  "pointer-events-auto relative block size-full cursor-pointer overflow-hidden [mask-image:linear-gradient(to_bottom,#000_72%,transparent_97%)] focus-visible:outline-offset-[6px]"
                : // No frame: the room fades out at the edges so she blends into the sky.
                  "pointer-events-auto relative block size-full cursor-pointer overflow-hidden rounded-[40%] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_45%,#000_55%,transparent_100%)] focus-visible:outline-offset-[6px]"
          }
          style={plate ? { backgroundColor: PLATE } : undefined}
        >
          {/* The picture includes the room, so it is skipped when the background is removed or replaced by PLATE. */}
          {poster && !alpha && !plate && (
            <Image
              src={HERO_POSTER}
              alt="Kanasu"
              fill
              priority
              sizes="(min-width: 1024px) 25rem, (min-width: 640px) 22rem, 17rem"
              className="object-cover object-[50%_28%]"
            />
          )}
          {/* Open variant: a full-height 16:9 "frame" centred in the box (the same crop as object-cover),
              so CLIP_FIT offsets are simply percentages of the video frame. */}
          <div className={open ? "absolute inset-y-0 left-1/2 aspect-video h-full -translate-x-1/2" : "absolute inset-0"}>
            <GazeFrames canvasRef={gaze.canvasRef} ready={gaze.ready} visible={tracking} />
            {order.map((clip) =>
              clips[clip] ? (
                <video
                  key={clip}
                  ref={(el) => {
                    videos.current[clip] = el;
                  }}
                  src={BASE + (alpha ? `${clip}.webm` : clips[clip])}
                  muted
                  playsInline
                  loop={clip === "idle"}
                  preload={clip === "intro" || clip === "idle" ? "auto" : "metadata"}
                  aria-hidden
                  onTimeUpdate={clip === "intro" ? onIntroTime : undefined}
                  onEnded={() => onEnded(clip)}
                  style={fitStyle(clip)}
                  className={`absolute inset-0 size-full object-cover object-[50%_25%] transition-opacity duration-300 ${
                    active === clip && !tracking ? "opacity-100" : "opacity-0"
                  }`}
                />
              ) : null,
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={!muted}
          aria-label={muted ? "Turn on sound" : "Mute sound"}
          className={`glass pointer-events-auto absolute inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-white ${
            open ? "bottom-[3%] left-1/2 -translate-x-1/2" : "bottom-3 right-3"
          }`}
        >
          {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4 text-iris" aria-hidden />}
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>
    </div>
  );
}
