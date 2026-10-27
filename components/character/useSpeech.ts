"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PREFERRED = [/heera|neerja|swara/i, /female|zira|aria|jenny|samantha|susan|hazel|libby|sonia/i];

function pickVoice(voices: SpeechSynthesisVoice[]) {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const indian = english.filter((v) => v.lang.toLowerCase() === "en-in");
  for (const pattern of PREFERRED) {
    const v = indian.find((x) => pattern.test(x.name)) ?? english.find((x) => pattern.test(x.name));
    if (v) return v;
  }
  return indian[0] ?? english[0] ?? null;
}

/**
 * Browser speech synthesis, off by default. Browsers only allow audio after a user
 * gesture, so `setEnabled(true)` must be called from a click handler (the sound toggle).
 */
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const enabledRef = useRef(false);
  const voice = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const synth = window.speechSynthesis;
    const pick = () => (voice.current = pickVoice(synth.getVoices()));
    pick();
    synth.addEventListener("voiceschanged", pick);
    return () => {
      synth.removeEventListener("voiceschanged", pick);
      synth.cancel();
    };
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const setEnabled = useCallback(
    (on: boolean) => {
      enabledRef.current = on;
      setEnabledState(on);
      if (!on) cancel();
    },
    [cancel],
  );

  /** Speaks `text` if sound is on. Returns false (and calls nothing) when muted or unsupported. */
  const speak = useCallback((text: string, events: { onStart: () => void; onEnd: () => void }) => {
    if (!enabledRef.current || !("speechSynthesis" in window)) return false;
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    if (voice.current) u.voice = voice.current;
    u.lang = voice.current?.lang ?? "en-IN";
    u.rate = 1.02;
    u.pitch = 1.2;
    u.onstart = events.onStart;
    u.onend = events.onEnd;
    u.onerror = events.onEnd;
    synth.cancel();
    synth.speak(u);
    return true;
  }, []);

  return { supported, enabled, setEnabled, speak, cancel };
}
