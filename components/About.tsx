import { BookOpen, GraduationCap, Languages, MapPin, Rocket } from "lucide-react";
import { profile } from "@/data/content";
import Reveal from "./Reveal";

const facts = [
  { icon: GraduationCap, label: "Studying", value: `${profile.degree}, ${profile.college}` },
  { icon: BookOpen, label: "Graduating", value: `${profile.graduation} · CGPA ${profile.cgpa}` },
  { icon: MapPin, label: "Based in", value: profile.location },
  { icon: Languages, label: "Speaks", value: profile.languages.join(", ") },
  { icon: Rocket, label: "Looking for", value: "Software development internships and graduate roles" },
];

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="section">
      <div className="container-x grid gap-12 @3xl:grid-cols-[1.15fr_0.85fr] @3xl:gap-12">
        <div>
          <Reveal>
            <p className="eyebrow mb-3">About me</p>
            <h2 id="about-title" className="font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl">
              Curious about people, <em className="font-normal text-rose-deep">serious</em> about systems.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              I&rsquo;m Kanasu, a Computer Science Engineering student at Kalpataru Institute of Technology (VTU), graduating in{" "}
              {profile.graduation}. I like problems that sit between people and software: a court registrar deciding which case
              to hear first, a family shop that needs to be found online, someone trying to tell whether a video is real.
            </p>
            <p>
              So far that has meant an award-winning deepfake detector, the admin side of a judicial case-management platform
              built with a team of four, and Power BI dashboards from my internship at Cyient. I care about interfaces that are
              clear, accessible and honest about what they do, and about the engineering underneath that makes them reliable.
            </p>
            <p>I&rsquo;m looking for software development internships and graduate roles where I can keep learning from strong engineers.</p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <dl className="glass relative overflow-hidden rounded-[2rem] p-2">
            <div aria-hidden className="absolute -right-16 -top-16 size-48 rounded-full bg-blush blur-3xl" />
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="relative flex items-start gap-4 rounded-3xl p-4 transition-colors hover:bg-white/70">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lilac text-iris">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <dt className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">{label}</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
