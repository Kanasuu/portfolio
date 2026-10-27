import Reveal from "./Reveal";

export default function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  id: string;
}) {
  return (
    <Reveal className="mb-12 max-w-2xl">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 id={id} className="font-display text-4xl leading-[1.05] font-medium tracking-tight text-ink sm:text-5xl">
        {title}
      </h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{intro}</p>}
    </Reveal>
  );
}
