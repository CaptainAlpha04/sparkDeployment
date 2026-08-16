import Link from "next/link";
import StarryCanvas from "@/components/starry-canvas";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { SparkMark, SparkBullet } from "@/components/brand/spark-mark";
import { getSiteStatsSafe } from "@/server/stats";

const principles = [
  {
    title: "No verdict",
    body: "Expertise is in the room and available the moment you ask for it. Nobody in that room has the power to decide whether you are capable.",
  },
  {
    title: "Real difficulty",
    body: "We do not make the material easier. We remove the penalty for finding it hard, which turns out to be the part that was stopping you.",
  },
  {
    title: "Your questions",
    body: "The discussion has no syllabus. The topic is whatever the room actually wants to know, and it goes wherever that leads.",
  },
];

const programmes = [
  {
    name: "SPARKx Talks",
    body: "Founders and builders in the open, taking real questions from a room that is allowed to push back.",
  },
  {
    name: "Camps",
    body: "Multi week, voluntary, ungraded. A technical track running alongside open discussion, with nothing riding on either.",
  },
  {
    name: "Mentorship",
    body: "Small groups working through machine learning, web, and hardware with people who are still close to learning it themselves.",
  },
  {
    name: "Campus chapters",
    body: "The whole model, brought to your university or school by students who want it there.",
  },
];

/**
 * Each element carries its own accent so the eight read as eight distinct
 * things rather than one brand colour repeated. Colours match the mission
 * page sequence, so an element looks the same wherever it appears.
 *
 * Split 5 then 3 on desktop, which balances better than an even wrap and
 * echoes the uneven points of the mark. Both rows wrap freely on mobile.
 */
const elementsRowOne = [
  { name: "Research", accent: "#3b82f6" },
  { name: "Entrepreneurship", accent: "#94a3b8" },
  { name: "Innovation", accent: "#f97316" },
  { name: "Leadership", accent: "#ef4444" },
  { name: "Creativity", accent: "#a855f7" },
];

const elementsRowTwo = [
  { name: "Education", accent: "#6366f1" },
  { name: "Technology", accent: "#06b6d4" },
  { name: "Collaboration", accent: "#22c55e" },
];

const benefits = [
  "Workshops and events you actually want to attend",
  "People building things worth being in the room for",
  "Support and resources for whatever you are chasing",
  "A first audience for the idea you have not told anyone about",
];

const communities = [
  {
    name: "LinkedIn",
    body: "Where we post what we are doing and who we are doing it with.",
    href: "https://www.linkedin.com/company/sparkchapter/",
    hover: "group-hover:text-sky-400",
    ring: "group-hover:border-sky-400/50",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.4 21.5h5.16V9.75H2.4V21.5Zm7.42 0h5.16v-6.19c0-1.63.31-3.2 2.32-3.2 1.99 0 2.02 1.85 2.02 3.3v6.09h5.16v-7.12c0-4.46-.96-7.4-6.18-7.4-2.5 0-4.19 1.38-4.88 2.68h-.07V9.75H9.82V21.5Z",
  },
  {
    name: "Instagram",
    body: "Photos from sessions, and the occasional thing we are proud of.",
    href: "https://www.instagram.com/sparkchapter?igsh=dzZzMG01NjAxbmNi",
    hover: "group-hover:text-pink-400",
    ring: "group-hover:border-pink-400/50",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.03a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z",
  },
  {
    name: "WhatsApp",
    body: "The group chat. Questions, resources, and where plans actually get made.",
    href: "https://chat.whatsapp.com/FYSriy557mw7FTKxWGprfS",
    hover: "group-hover:text-emerald-400",
    ring: "group-hover:border-emerald-400/50",
    path: "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35ZM12.05 22a9.9 9.9 0 0 1-5.04-1.38l-3.52.92.94-3.43A9.93 9.93 0 1 1 12.05 22Z",
  },
];

export default async function HomePage() {
  const stats = await getSiteStatsSafe();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────
          One line, nothing else competing with it. Everything the visitor
          needs to understand is taught by the sections underneath. */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6"
        style={{ background: "linear-gradient(to bottom, #000000 0%, #05060f 55%, #0a0b16 100%)" }}>
        <StarryCanvas numberOfStars={200} shootingStars />

        <div className="relative z-10 flex flex-col items-center text-center">
          <SparkMark
            interactive
            gradient
            className="mb-10 size-16 drop-shadow-[0_0_30px_oklch(0.62_0.19_296_/_0.5)] md:size-20"
          />

          <h1 className="max-w-4xl text-7xl font-extrabold md:text-8xl">
            <span className="animation-swipe-from-bottom block">Here ideas</span>
            <span
              className="animation-swipe-from-bottom block bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 bg-clip-text text-transparent"
              style={{ animationDelay: "130ms" }}
            >
              spark into reality
            </span>
          </h1>
        </div>

        <div
          className="animation-fade-in absolute bottom-10 flex flex-col items-center gap-2"
          style={{ animationDelay: "900ms" }}
        >
          <span className="eyebrow">Keep going</span>
          <span className="h-12 w-px bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── The claim ────────────────────────────────────────────────────── */}
      <section className="w-full px-6 py-32"
        style={{ background: "linear-gradient(to bottom, #0a0b16, #10132e)" }}
      >
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <p className="eyebrow mb-6">Why we exist</p>
            <h2 className="text-5xl leading-tight font-bold md:text-6xl">
              You already have access to everything. That was never the hard part.
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Every lecture, every paper, every course is one search away. What is
              missing is somewhere to think out loud, be wrong in front of people,
              and chase a question without being scored on it. That room is rare,
              and it is the only thing we build.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── What we build ────────────────────────────────────────────────── */}
      <section className="w-full px-6 py-32"
        style={{ background: "linear-gradient(to bottom, #10132e, #0b1a22)" }}
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="eyebrow mb-4">What we build</p>
            <h2 className="max-w-2xl text-5xl font-bold">
              Rooms where being wrong costs nothing.
            </h2>
          </Reveal>

          <Stagger step={90} className="mt-16 grid gap-10 md:grid-cols-3">
            {principles.map((principle) => (
              <div key={principle.title} className="border-t border-border pt-6">
                <h3 className="mb-3 text-2xl font-semibold">{principle.title}</h3>
                <p className="leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Programmes ───────────────────────────────────────────────────── */}
      <section className="w-full px-6 py-32"
        style={{ background: "linear-gradient(to bottom, #0b1a22, #0a0b16)" }}>
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="eyebrow mb-4">Programmes</p>
            <h2 className="max-w-2xl text-5xl font-bold">Four ways in.</h2>
          </Reveal>

          <Stagger step={80} className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
            {programmes.map((programme, i) => (
              <div
                key={programme.name}
                className="group bg-background p-8 transition-colors duration-300 hover:bg-card md:p-10"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 mb-3 text-2xl font-semibold transition-colors group-hover:text-primary">
                  {programme.name}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {programme.body}
                </p>
              </div>
            ))}
          </Stagger>

          <Reveal delay={120}>
            <div className="mt-10">
              <Link href="/events" className="btn-stylized">
                See what is coming up
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Elements ─────────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden px-6 py-32"
        style={{ background: "linear-gradient(to bottom, #0a0b16, #050610)" }}>
        <SparkMark
          className="pointer-events-none absolute top-1/2 left-1/2 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 text-white/[0.02]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <Reveal>
            <p className="eyebrow mb-4">What we work on</p>
            <h2 className="text-5xl font-bold">Eight forces, one spark.</h2>
            <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
              Eight elements, and a mark with eight points. That was not a
              coincidence when we chose it.
            </p>
          </Reveal>

          <div className="mt-14 space-y-3">
            <Stagger step={60} className="flex flex-wrap justify-center gap-3">
              {elementsRowOne.map((element) => (
                <span
                  key={element.name}
                  className="element-pill flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm"
                  style={{ ["--pill" as string]: element.accent }}
                >
                  <SparkBullet className="element-pill-mark size-3" />
                  {element.name}
                </span>
              ))}
            </Stagger>

            <Stagger
              step={60}
              initialDelay={300}
              className="flex flex-wrap justify-center gap-3"
            >
              {elementsRowTwo.map((element) => (
                <span
                  key={element.name}
                  className="element-pill flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm"
                  style={{ ["--pill" as string]: element.accent }}
                >
                  <SparkBullet className="element-pill-mark size-3" />
                  {element.name}
                </span>
              ))}
            </Stagger>
          </div>

          <Reveal delay={200}>
            <Link
              href="/mission"
              className="mt-12 inline-block text-sm text-primary transition-opacity hover:opacity-80"
            >
              Read what we actually mean by this →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Impact ───────────────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <section className="w-full px-6 py-28"
          style={{ background: "linear-gradient(to bottom, #050610, #0a0b16)" }}>
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <p className="eyebrow mb-10 text-center">So far</p>
            </Reveal>

            <Stagger
              step={90}
              className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4"
            >
              {stats.map((stat) => (
                <div
                  key={stat.key}
                  className="border-t border-border pt-5 transition-colors duration-300 hover:border-primary/60"
                >
                  <CountUp
                    value={stat.value}
                    className="block bg-gradient-to-r from-orange-500 to-violet-500 bg-clip-text text-6xl font-extrabold text-transparent tabular-nums"
                  />
                  <div className="mt-2 font-mono text-[0.6875rem] tracking-[0.16em] text-muted-foreground uppercase">
                    {stat.label}
                  </div>
                </div>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ── Joining ──────────────────────────────────────────────────────
          Previously carried a full-bleed orange-to-blue wash with animated
          rules top and bottom, which read as a promotional banner rather than
          part of the page. It now sits in the same palette as everything else,
          with the single accent doing the work. */}
      <section
        className="relative w-full px-6 py-28"
        style={{
          // Picks up wherever the previous section actually ended. The impact
          // block is conditional, so hardcoding a start colour here would leave
          // a visible seam on any page load where the stats fail to resolve.
          background: `linear-gradient(to bottom, ${
            stats.length > 0 ? "#0a0b16" : "#050610"
          }, #150e2a)`,
        }}
      >
        <div className="mx-auto grid max-w-5xl items-center gap-14 md:grid-cols-2">
          <div>
            <Reveal>
              <p className="eyebrow mb-4">Joining</p>
              <h2 className="mb-8 text-5xl font-bold">
                It costs nothing to start.
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
                No fees, no entry test, no prerequisites. Turn up to one thing and
                decide afterwards whether you want the next one.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <Link href="/signup" className="btn-stylized">
                Join SPARK
              </Link>
            </Reveal>
          </div>

          <Stagger step={90} className="space-y-5">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 border-t border-white/8 pt-5"
              >
                <SparkBullet className="mt-1 size-3.5 shrink-0 text-primary" />
                <span className="leading-relaxed text-muted-foreground">
                  {benefit}
                </span>
              </div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Community ────────────────────────────────────────────────────── */}
      <section className="relative z-10 w-full overflow-hidden px-6 py-28"
        style={{ background: "linear-gradient(to bottom, #150e2a, #000000)" }}>
        <div
          className="float-drift absolute top-1/3 left-1/4 -z-10 h-40 w-1/2 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 opacity-20 blur-3xl"
          style={{
            ["--drift-duration" as string]: "20s",
            ["--drift-x" as string]: "50px",
            ["--drift-y" as string]: "-24px",
          }}
          aria-hidden
        />

        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow mb-4 text-center">Where we are</p>
            <h2 className="text-center text-5xl font-bold">Come find us.</h2>
          </Reveal>

          <Stagger step={80} className="mt-14 grid gap-4 md:grid-cols-3">
            {communities.map((c) => (
              <a
                key={c.name}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card/60 p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-card ${c.ring}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`size-7 fill-current text-muted-foreground transition-colors duration-500 ${c.hover}`}
                  aria-hidden
                >
                  <path d={c.path} />
                </svg>
                <h3 className="text-lg font-semibold">{c.name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
              </a>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  );
}
