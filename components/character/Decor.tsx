"use client";

import { useSpring } from "framer-motion";
import { Chip, Layer } from "./PortraitCharacter";
import type { CharacterPointer } from "./useCharacterPointer";

/** Pastel glow, floating island and chips around the character stage (decorative). */
export default function Decor({ pointer }: { pointer: CharacterPointer }) {
  const sx = useSpring(pointer.x, { stiffness: 70, damping: 18, mass: 0.7 });
  const sy = useSpring(pointer.y, { stiffness: 70, damping: 18, mass: 0.7 });
  return (
    <>
      <Layer
        x={sx}
        y={sy}
        amount={-20}
        className="absolute -inset-10 rounded-full bg-[radial-gradient(circle_at_30%_35%,#f9c6d9_0%,transparent_55%),radial-gradient(circle_at_75%_70%,#c9b8f4_0%,transparent_55%),radial-gradient(circle_at_60%_20%,#c6eedf_0%,transparent_45%)] opacity-90 blur-2xl"
      />
      <Layer x={sx} y={sy} amount={6} className="absolute inset-x-[14%] bottom-[-1.25rem] h-8">
        <div className="absolute left-1/2 top-1/2 h-14 w-[55%] -translate-x-1/2 bg-gradient-to-b from-lavender/80 to-transparent [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-mint to-mint-mid shadow-[0_18px_30px_-12px_rgb(108_79_207/0.35)]" />
      </Layer>
      <Chip x={sx} y={sy} amount={18} className="-left-4 top-[12%] z-10 sm:-left-12" delay="0s" dot="bg-rose">
        1st place · AI-Thon
      </Chip>
      <Chip x={sx} y={sy} amount={24} className="-right-3 top-[50%] z-10 sm:-right-10" delay="1.2s" dot="bg-lavender">
        React · Node · Python
      </Chip>
      <Chip x={sx} y={sy} amount={14} className="-left-2 bottom-[14%] z-10 sm:-left-8" delay="2.1s" dot="bg-mint-mid">
        CSE · Class of 2027
      </Chip>
    </>
  );
}
