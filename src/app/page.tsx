import Image from "next/image";
import Link from "next/link";
import StarryCanvas from "@/components/starry-canvas";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { SparkMark, SparkBullet } from "@/components/brand/spark-mark";

const sponsors = [
  { name: "TensorFlow Islamabad", logo: "/images/tensorflow.png" },
  { name: "NUST Entrepreneurs Club", logo: "/images/nec.png" },
  { name: "Google Pakistan", logo: "/images/google.png" },
  { name: "Poshish Interiors", logo: "/images/poshish.png" },
];

const benefits = [
  "Access to exclusive innovation events and workshops",
  "Networking opportunities with industry leaders",
  "Resources and support for your innovative projects",
  "Potential funding opportunities for promising ideas",
];

const stats = [
  { label: "Student Members", value: "500+" },
  { label: "Successful Events", value: "3+" },
  { label: "Affliated Societies", value: "10+" },
  { label: "Affiliated Institutions", value: "50+" },
];

const communities = [
  {
    name: "Discord",
    body: "Get latest updates on events and get in touch with our Team",
    href: "https://discord.com/invite/5Tx5Ev8K",
    hover: "group-hover:text-violet-400",
    ring: "group-hover:border-violet-400/50",
    path: "M19.3 5.34A16.7 16.7 0 0 0 15.1 4l-.2.4a12.6 12.6 0 0 1 3.7 1.9 13 13 0 0 0-11.2 0 12.6 12.6 0 0 1 3.7-1.9L10.9 4a16.7 16.7 0 0 0-4.2 1.34C4 9.3 3.3 13.1 3.65 16.86A16.8 16.8 0 0 0 8.8 19.5l.65-.9a11 11 0 0 1-1.7-.83l.42-.32a11.8 11.8 0 0 0 9.66 0l.42.32a11 11 0 0 1-1.7.83l.65.9a16.8 16.8 0 0 0 5.15-2.64c.42-4.35-.7-8.12-3.05-11.52ZM9.55 14.6c-1 0-1.83-.92-1.83-2.05 0-1.13.8-2.06 1.83-2.06s1.85.93 1.83 2.06c0 1.13-.81 2.05-1.83 2.05Zm4.9 0c-1 0-1.83-.92-1.83-2.05 0-1.13.8-2.06 1.83-2.06s1.84.93 1.83 2.06c0 1.13-.8 2.05-1.83 2.05Z",
  },
  {
    name: "LinkedIn",
    body: "Connect with Industry Experts and like Minded Individuals",
    href: "https://www.linkedin.com/company/sparkchapter/",
    hover: "group-hover:text-sky-400",
    ring: "group-hover:border-sky-400/50",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.4 21.5h5.16V9.75H2.4V21.5Zm7.42 0h5.16v-6.19c0-1.63.31-3.2 2.32-3.2 1.99 0 2.02 1.85 2.02 3.3v6.09h5.16v-7.12c0-4.46-.96-7.4-6.18-7.4-2.5 0-4.19 1.38-4.88 2.68h-.07V9.75H9.82V21.5Z",
  },
  {
    name: "Instagram",
    body: "Follow up on our Events and Progress",
    href: "https://www.instagram.com/sparkchapter?igsh=dzZzMG01NjAxbmNi",
    hover: "group-hover:text-pink-400",
    ring: "group-hover:border-pink-400/50",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.03a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z",
  },
  {
    name: "WhatsApp",
    body: "Ask Questions and get Resources curated for Community",
    href: "https://chat.whatsapp.com/FYSriy557mw7FTKxWGprfS",
    hover: "group-hover:text-emerald-400",
    ring: "group-hover:border-emerald-400/50",
    path: "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35ZM12.05 22a9.9 9.9 0 0 1-5.04-1.38l-3.52.92.94-3.43A9.93 9.93 0 1 1 12.05 22Z",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black via-background to-purple-950/60 px-6">
        <StarryCanvas />

        {/* The mark leads. It is the org's own glyph and the literal subject
            of the name, so it earns the position a stock gradient blob usually
            occupies. */}
        <div className="relative z-10 mb-8">
          <div
            className="absolute inset-0 -z-10 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.62 0.19 296 / 0.5), transparent 68%)",
            }}
            aria-hidden
          />
          <SparkMark
            interactive
            gradient
            className="size-20 drop-shadow-[0_0_28px_oklch(0.62_0.19_296_/_0.55)] md:size-24"
          />
        </div>

        <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
          <p className="eyebrow animation-fade-in mb-5">
            Innovation community · Pakistan
          </p>

          <h1 className="text-7xl font-extrabold md:text-8xl">
            <span className="animation-swipe-from-bottom block">Here ideas</span>
            <span
              className="animation-swipe-from-bottom block bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 bg-clip-text text-transparent"
              style={{ animationDelay: "130ms" }}
            >
              spark into reality
            </span>
          </h1>

          <p
            className="animation-fade-in mt-6 max-w-xl text-lg text-muted-foreground"
            style={{ animationDelay: "260ms" }}
          >
            The fastest growing innovation community of Pakistan — students,
            builders, and researchers turning ideas into things that exist.
          </p>

          <div
            className="animation-fade-in mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "380ms" }}
          >
            <Link href="/events" className="btn-stylized">
              See upcoming events
            </Link>
            <Link
              href="/mission"
              className="rounded-3xl px-6 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              What we&apos;re building →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it all started ───────────────────────────────────────────── */}
      <section className="relative w-full bg-gradient-to-b from-purple-950/60 to-slate-950 px-6 py-28">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <Reveal>
            <div className="md:sticky md:top-28">
              <p className="eyebrow mb-4">Origin</p>
              <h2 className="text-6xl font-bold">
                How it all <br /> started…
              </h2>
            </div>
          </Reveal>

          <div className="flex flex-col gap-5 text-muted-foreground">
            <Reveal delay={60}>
              <p>
                SPARK is Pakistan&apos;s premier innovation community, dedicated to
                fostering creativity, entrepreneurship, and technological
                advancement across the nation.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p>
                Our mission is to empower individuals and institutions to turn their
                groundbreaking ideas into reality, contributing to Pakistan&apos;s
                growth and global competitiveness.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <p>
                We provide a platform for innovators, entrepreneurs, and students to
                connect, collaborate, and create, driving positive change in society
                and the economy through innovation and impact.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <Link href="/mission" className="btn-stylized mt-4 w-fit">
                Learn more
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Our Impact ───────────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-b from-slate-950 to-background px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="eyebrow mb-3 text-center">By the numbers</p>
            <h2 className="mb-14 text-center text-5xl font-bold">Our impact</h2>
          </Reveal>

          <Stagger
            step={90}
            className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group border-t border-border pt-5 transition-colors duration-300 hover:border-primary/60"
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

      {/* ── Sponsors ─────────────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-b from-background to-black px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow mb-10 text-center">Sponsors and partners</p>
          </Reveal>

          <Stagger
            step={80}
            className="flex flex-wrap items-center justify-center gap-x-14 gap-y-10"
          >
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.name}
                className="group flex w-40 flex-col items-center gap-3 transition-transform duration-300 hover:-translate-y-1"
              >
                <Image
                  src={sponsor.logo}
                  alt={sponsor.name}
                  width={120}
                  height={48}
                  className="h-11 w-auto object-contain opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                />
                <p className="text-center text-xs text-muted-foreground">
                  {sponsor.name}
                </p>
              </div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Become a Member ──────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden py-24">
        <div
          className="absolute inset-0 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 opacity-20"
          aria-hidden
        />
        <div
          className="gradient-pan absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500"
          aria-hidden
        />
        <div
          className="gradient-pan absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500"
          aria-hidden
        />

        <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-12 px-6 md:grid-cols-2">
          <div>
            <Reveal>
              <p className="eyebrow mb-3">Membership</p>
              <h2 className="mb-8 text-5xl font-bold">Why join SPARK?</h2>
            </Reveal>

            <Stagger step={90} className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  {/* The org's own mark as the list marker, replacing a
                      generic lightning bolt that belonged to no brand. */}
                  <SparkBullet className="mt-1 size-3.5 shrink-0 text-orange-500" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </Stagger>
          </div>

          <Reveal delay={120}>
            <div className="rounded-2xl border border-primary/40 bg-black/40 p-8 backdrop-blur-lg transition-all duration-500 hover:-translate-y-1 hover:border-primary/70">
              <h3 className="mb-3 text-2xl font-semibold">
                Ready to ignite your ideas?
              </h3>
              <p className="mb-7 text-sm text-muted-foreground">
                Join SPARK today and be part of Pakistan&apos;s fastest-growing
                innovation community.
              </p>
              <Link href="/signup" className="btn-stylized">
                Register now
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Join Our Community ───────────────────────────────────────────── */}
      <section className="relative z-10 w-full overflow-hidden bg-background px-6 py-28">
        <div
          className="float-drift absolute top-1/3 left-1/4 -z-10 h-40 w-1/2 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 opacity-30 blur-3xl"
          style={{
            ["--drift-duration" as string]: "20s",
            ["--drift-x" as string]: "50px",
            ["--drift-y" as string]: "-24px",
          }}
          aria-hidden
        />

        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow mb-3 text-center">Community</p>
            <h2 className="text-center text-5xl font-bold">
              Join our community
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground">
              Innovative and talented individuals across every platform — pick
              wherever you already are.
            </p>
          </Reveal>

          <Stagger
            step={80}
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {communities.map((c) => (
              <a
                key={c.name}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-card ${c.ring}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`size-8 fill-current text-muted-foreground transition-colors duration-500 ${c.hover}`}
                  aria-hidden
                >
                  <path d={c.path} />
                </svg>
                <h3 className="text-lg font-semibold">{c.name}</h3>
                <p className="text-sm text-muted-foreground">{c.body}</p>
                <span className="mt-auto pt-3 text-sm text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Join now →
                </span>
              </a>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  );
}
