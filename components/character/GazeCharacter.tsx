"use client";

import { useReducedMotion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { GREETING_SPEECH, GREETING_TEXT, HERO_POSTER, TAP_LINES, talkSeconds } from "./config";
import Decor from "./Decor";
import SpeechBubble from "./SpeechBubble";
import type { CharacterPointer } from "./useCharacterPointer";
import { useGazeFrames } from "./useGazeFrames";
import { useSpeech } from "./useSpeech";

const GREETED_KEY = "kanasu:greeted-gaze";

const stripEmoji = (s: string) => s.replace(/\p{Extended_Pictographic}/gu, "").trim();

/**
 * Cursor-tracking character built from pre-rendered frames of Kanasu's picture (see useGazeFrames).
 * Used when there are tracking frames but no hero videos.
 */
export default function GazeCharacter({
  pointer,
  targetRef,
  onUnavailable,
}: {
  pointer: CharacterPointer;
  targetRef: React.RefObject<HTMLDivElement | null>;
  onUnavailable: () => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const gaze = useGazeFrames({ pointer, reduce, onUnavailable });
  const { ready, startTalking, stopTalking, smile, later } = gaze;
  const [message, setMessage] = useState<string | null>(null);
  const tapIndex = useRef(0);
  const speech = useSpeech();

  const say = useCallback(
    (text: string, afterSmile = false) => {
      setMessage(text);
      const smileAfter = () => afterSmile && smile();
      const audio = speech.speak(stripEmoji(text === GREETING_TEXT ? GREETING_SPEECH : text), {
        onStart: () => startTalking(Infinity),
        onEnd: () => {
          stopTalking();
          smileAfter();
          later(() => setMessage((m) => (m === text ? null : m)), 2600);
        },
      });
      if (!audio) {
        const secs = talkSeconds(text);
        startTalking(secs);
        later(smileAfter, secs * 1000 + 50);
        later(() => setMessage((m) => (m === text ? null : m)), secs * 1000 + 2800);
      }
    },
    [speech, startTalking, stopTalking, smile, later],
  );

  // First visit this session: greet once the frames are ready.
  useEffect(() => {
    if (!ready) return;
    let first = true;
    try {
      first = !window.sessionStorage.getItem(GREETED_KEY);
    } catch {}
    if (!first && !new URLSearchParams(window.location.search).has("greet")) return;
    const t = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(GREETED_KEY, "1");
      } catch {}
      say(GREETING_TEXT, true);
    }, 900);
    return () => window.clearTimeout(t);
    // Run once when the frames arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const sayHi = () => {
    if (!ready) return;
    say(TAP_LINES[tapIndex.current++ % TAP_LINES.length], true);
  };

  const dismiss = useCallback(() => {
    setMessage(null);
    speech.cancel();
    stopTalking();
  }, [speech, stopTalking]);

  useEffect(() => {
    if (!message) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message, dismiss]);

  const toggleSound = () => {
    if (speech.enabled) {
      speech.setEnabled(false);
      stopTalking();
    } else {
      speech.setEnabled(true);
      say(GREETING_TEXT, true);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-[22rem] lg:max-w-[25rem]">
      <Decor pointer={pointer} />
      <SpeechBubble message={message} onDismiss={dismiss} />

      <div ref={targetRef} className="relative">
        <button
          type="button"
          onClick={sayHi}
          aria-label="Say hi to Kanasu"
          className="arch pointer-events-auto relative block aspect-[4/5] w-full cursor-pointer overflow-hidden border-[6px] border-white/85 bg-lilac shadow-[var(--shadow-lift)] focus-visible:outline-offset-[6px]"
        >
          {/* The picture shows instantly; the generated frames take over once decoded. */}
          <Image
            src={HERO_POSTER}
            alt="Kanasu"
            fill
            priority
            sizes="(min-width: 1024px) 25rem, (min-width: 640px) 22rem, 17rem"
            className="object-cover object-[50%_28%]"
          />
          <GazeFrames canvasRef={gaze.canvasRef} ready={ready} />
        </button>

        {speech.supported && ready && (
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={speech.enabled}
            aria-label={speech.enabled ? "Mute Kanasu's voice" : "Turn on Kanasu's voice"}
            className="glass pointer-events-auto absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-white"
          >
            {speech.enabled ? <Volume2 className="size-4 text-iris" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
            {speech.enabled ? "Sound on" : "Sound off"}
          </button>
        )}
      </div>
    </div>
  );
}

/** Canvas the gaze frames are blended onto; cropped like the hero videos so hand-offs line up. */
export function GazeFrames({
  canvasRef,
  ready,
  visible = true,
}: {
  canvasRef: (el: HTMLCanvasElement | null) => void;
  ready: boolean;
  visible?: boolean;
}) {
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`absolute inset-0 size-full object-cover object-[50%_25%] transition-opacity duration-150 ${
        visible && ready ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
