"use client";

// Lets the dream map ask the hero character to react (play a clip, say a line)
// without threading callbacks through the character components.
const EVENT = "portfolio:character-reaction";

export type Reaction = { clip?: "wave" | "spin" | "celebrate" | "laptop" | "contact"; line?: string };

export function reactCharacter(reaction: Reaction) {
  window.dispatchEvent(new CustomEvent<Reaction>(EVENT, { detail: reaction }));
}

export function onCharacterReaction(handler: (reaction: Reaction) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<Reaction>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
