"use client";

import { useReducedMotion } from "framer-motion";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { hasWebGL } from "@/lib/webgl";
import { CHARACTER_MODEL_URL, GREETING_SPEECH, GREETING_TEXT, HAS_CHARACTER_MODEL, HAS_GAZE_FRAMES, HAS_HERO_VIDEO, HERO_VIDEOS, SAMPLE_MODEL_URL, TAP_LINES, talkSeconds } from "./config";
import Decor from "./Decor";
import GazeCharacter from "./GazeCharacter";
import VideoCharacter from "./VideoCharacter";
import PortraitCharacter from "./PortraitCharacter";
import SpeechBubble from "./SpeechBubble";
import type { CharacterPointer } from "./useCharacterPointer";
import { useSpeech } from "./useSpeech";
import type { CharacterController, Phase } from "./vrm/CharacterController";
import type { StageStatus } from "./vrm/VrmStage";

// three-vrm and the loader are only downloaded when a 3D character will actually render.
const VrmStage = dynamic(() => import("./vrm/VrmStage"), { ssr: false });

const GREETED_KEY = "kanasu:greeted-3d";

type Mode =
  | { kind: "resolving" }
  | { kind: "gaze" }
  | { kind: "video" }
  | { kind: "vrm"; url: string; sample: boolean }
  | { kind: "portrait"; reason: string };

const stripEmoji = (s: string) => s.replace(/\p{Extended_Pictographic}/gu, "").trim();

export default function HeroCharacter({
  pointer,
  targetRef,
  variant = "framed",
}: {
  pointer: CharacterPointer;
  targetRef: React.RefObject<HTMLDivElement | null>;
  /** Frameless look for the video character (the other modes keep their own frame). */
  variant?: "framed" | "open";
}) {
  const reduce = useReducedMotion() ?? false;
  const [mode, setMode] = useState<Mode>({ kind: "resolving" });
  const [status, setStatus] = useState<StageStatus>({ state: "loading", progress: null });
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [greet, setGreet] = useState(false);
  const [hold, setHold] = useState<"knock" | "wave" | null>(null);
  const controllerRef = useRef<CharacterController | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const tapIndex = useRef(0);
  const speech = useSpeech();

  // Decide what to render: video clips, gaze frames, her own VRM, the labelled sample (?model=sample), or the portrait.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("model");
    const dev = process.env.NODE_ENV === "development";
    if (dev) {
      const p = params.get("characterPose");
      if (p === "knock" || p === "wave") setHold(p);
    }
    let firstThisSession = true;
    try {
      firstThisSession = !window.sessionStorage.getItem(GREETED_KEY);
    } catch {}
    setGreet(firstThisSession || params.has("greet"));

    // Order: explicit ?model=…, then her video clips, cursor-tracking frames, her own VRM, then the portrait.
    if (requested === "portrait") return setMode({ kind: "portrait", reason: "Requested with ?model=portrait." });
    const webgl = hasWebGL();
    if (requested === "sample" && webgl) return setMode({ kind: "vrm", url: SAMPLE_MODEL_URL, sample: true });
    if (requested !== "vrm" && requested !== "gaze" && HAS_HERO_VIDEO) return setMode({ kind: "video" });
    if (requested !== "vrm" && HAS_GAZE_FRAMES) return setMode({ kind: "gaze" });
    if (HAS_CHARACTER_MODEL && webgl) return setMode({ kind: "vrm", url: CHARACTER_MODEL_URL, sample: false });
    setMode({ kind: "portrait", reason: webgl ? `No character frames or model at ${CHARACTER_MODEL_URL}.` : "WebGL is not available." });
  }, []);

  useEffect(() => {
    if (status.state === "error") {
      console.warn(`[character] ${status.message} Showing the illustrated fallback.`);
      setMode({ kind: "portrait", reason: status.message });
    }
  }, [status]);

  // Pause rendering while the hero is off screen.
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [targetRef, mode.kind]);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const hideLater = useCallback((ms: number) => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setMessage(null), ms);
  }, []);

  /** Shows `text` in the bubble and animates her mouth: real speech if sound is on, a talking animation otherwise. */
  const say = useCallback(
    (text: string, spoken: string) => {
      const c = controllerRef.current;
      window.clearTimeout(hideTimer.current);
      setMessage(text);
      const audio = speech.speak(spoken, {
        onStart: () => controllerRef.current?.talk(Infinity, true),
        onEnd: () => {
          controllerRef.current?.stopTalking();
          hideLater(2600);
        },
      });
      if (!audio) {
        c?.talk(talkSeconds(text));
        hideLater(talkSeconds(text) * 1000 + 2800);
      }
    },
    [speech, hideLater],
  );

  const onPhase = useCallback(
    (p: Phase) => {
      if (p !== "greeting") return;
      try {
        window.sessionStorage.setItem(GREETED_KEY, "1");
      } catch {}
      say(GREETING_TEXT, GREETING_SPEECH);
    },
    [say],
  );

  const sayHi = () => {
    const c = controllerRef.current;
    if (!c || !c.wave()) return;
    const line = TAP_LINES[tapIndex.current++ % TAP_LINES.length];
    say(line, stripEmoji(line));
  };

  const toggleSound = () => {
    if (speech.enabled) {
      speech.setEnabled(false);
      controllerRef.current?.stopTalking();
      return;
    }
    speech.setEnabled(true);
    // Turning sound on is a user gesture, so she can say the greeting out loud now.
    const c = controllerRef.current;
    if (c && (c.phase === "idle" || c.phase === "greeting" || c.phase === "waving")) {
      if (c.phase === "idle") c.wave();
      say(GREETING_TEXT, GREETING_SPEECH);
    }
  };

  const dismiss = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    setMessage(null);
    speech.cancel();
    controllerRef.current?.stopTalking();
  }, [speech]);

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message, dismiss]);

  if (mode.kind === "portrait") return <PortraitCharacter pointer={pointer} targetRef={targetRef} />;
  if (mode.kind === "video") return <VideoCharacter pointer={pointer} targetRef={targetRef} clips={HERO_VIDEOS} variant={variant} />;
  if (mode.kind === "gaze")
    return (
      <GazeCharacter
        pointer={pointer}
        targetRef={targetRef}
        onUnavailable={() => setMode({ kind: "portrait", reason: "Gaze frames failed to load." })}
      />
    );

  const sample = mode.kind === "vrm" && mode.sample;
  const ready = status.state === "ready";

  return (
    <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-[22rem] lg:max-w-[25rem]">
      <Decor pointer={pointer} />
      <SpeechBubble message={message} onDismiss={dismiss} />

      <div ref={targetRef} className="relative aspect-[4/5]">
        {mode.kind === "vrm" && (
          <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
            <VrmStage
              url={mode.url}
              pointer={pointer}
              reduced={reduce}
              greet={greet}
              hold={hold}
              active={visible}
              controllerRef={controllerRef}
              onStatus={setStatus}
              onPhase={onPhase}
            />
          </div>
        )}

        {!ready && (
          <div role="status" className="absolute inset-0 grid place-items-center">
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink">
              <Loader2 className="size-4 animate-spin text-iris" aria-hidden />
              Loading 3D character
              {status.state === "loading" && status.progress !== null && ` · ${Math.round(status.progress * 100)}%`}
            </span>
          </div>
        )}

        {/* Transparent hit area over the canvas: keyboard and screen-reader friendly. */}
        <button
          type="button"
          onClick={sayHi}
          disabled={!ready}
          aria-label="Say hi to Kanasu's 3D character"
          className="pointer-events-auto absolute inset-x-[12%] inset-y-0 cursor-pointer rounded-[2rem] disabled:cursor-default focus-visible:outline-offset-4"
        />

        {sample && ready && (
          <span
            className="glass pointer-events-auto absolute bottom-3 left-2 rounded-full px-3 py-1.5 text-[11px] font-bold text-ink-soft"
            title="Temporary pixiv VRM sample used to test the 3D pipeline. Add public/models/kanasu.vrm to show Kanasu's own character."
          >
            Sample model · not Kanasu
          </span>
        )}

        {speech.supported && ready && (
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={speech.enabled}
            aria-label={speech.enabled ? "Mute Kanasu's voice" : "Turn on Kanasu's voice"}
            className="glass pointer-events-auto absolute bottom-3 right-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-white"
          >
            {speech.enabled ? <Volume2 className="size-4 text-iris" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
            {speech.enabled ? "Sound on" : "Sound off"}
          </button>
        )}
      </div>
    </div>
  );
}
