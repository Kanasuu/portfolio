/** Galaxy backdrop: deep space, a faint Milky Way band, slow nebulae and layered stars (decorative, CSS only). */

// Fixed pseudo-random star fields so server and client render the same markup.
function starField(count: number, seed: number) {
  let s = seed;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: count }, () => ({
    left: rand() * 100,
    top: rand() * 100,
    delay: rand() * 6,
    duration: 3 + rand() * 4,
    dim: 0.35 + rand() * 0.5,
  }));
}
const dust = starField(140, 11);
const stars = starField(45, 29);
const bright = starField(9, 53);

export default function AuroraSky() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(ellipse_110%_85%_at_55%_35%,#1b1446_0%,#0d0a26_45%,#05040f_100%)]">
      {/* Milky Way: a soft diagonal band of light. */}
      <div className="absolute left-1/2 top-1/2 h-[38%] w-[160%] -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] bg-[radial-gradient(ellipse_at_center,rgb(196_181_253/0.16)_0%,rgb(129_140_248/0.08)_35%,transparent_70%)] blur-2xl" />

      {/* Nebulae */}
      <div className="absolute -left-[12%] top-[8%] h-[55%] w-[45%] rounded-full bg-[#6d4aff]/25 blur-[120px] motion-safe:animate-aurora" />
      <div className="absolute right-[-8%] top-[-10%] h-[50%] w-[45%] rounded-full bg-[#d9468f]/18 blur-[130px] motion-safe:animate-aurora [animation-delay:-9s]" />
      <div className="absolute bottom-[-20%] left-[30%] h-[50%] w-[50%] rounded-full bg-[#1fb5c9]/15 blur-[130px] motion-safe:animate-aurora [animation-delay:-15s]" />

      {dust.map((d, i) => (
        <span key={`d${i}`} className="absolute size-px rounded-full bg-white" style={{ left: `${d.left}%`, top: `${d.top}%`, opacity: d.dim * 0.7 }} />
      ))}
      {stars.map((d, i) => (
        <span
          key={`s${i}`}
          className="absolute size-[2px] rounded-full bg-white motion-safe:animate-twinkle"
          style={{ left: `${d.left}%`, top: `${d.top}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.duration}s` }}
        />
      ))}
      {bright.map((d, i) => (
        <span
          key={`b${i}`}
          className="absolute size-[3px] rounded-full bg-white shadow-[0_0_8px_2px_rgb(255_255_255/0.6),0_0_18px_4px_rgb(167_139_250/0.35)] motion-safe:animate-twinkle"
          style={{ left: `${d.left}%`, top: `${d.top}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.duration + 2}s` }}
        />
      ))}

      {/* An occasional shooting star. */}
      <span className="absolute left-[70%] top-[12%] h-px w-28 -rotate-[28deg] bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 motion-safe:animate-[shoot_14s_ease-in_infinite_4s]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgb(5_4_15/0.7)_100%)]" />
    </div>
  );
}
