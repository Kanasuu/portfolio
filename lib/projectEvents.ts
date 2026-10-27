"use client";

// Lets the 3D scene, skills and achievements open a project's case study
// without threading state through every section.
const EVENT = "portfolio:open-project";

export function openProject(id: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: id }));
}

export function onOpenProject(handler: (id: string) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
