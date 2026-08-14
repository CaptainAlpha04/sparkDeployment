import Image from "next/image";
import Link from "next/link";
import StarryCanvas from "@/components/starry-canvas";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";

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
    hover: "group-hover:text-violet-500",
    ring: "group-hover:border-violet-500/60",
    path: "M19.3 5.34A16.7 16.7 0 0 0 15.1 4l-.2.4a12.6 12.6 0 0 1 3.7 1.9 13 13 0 0 0-11.2 0 12.6 12.6 0 0 1 3.7-1.9L10.9 4a16.7 16.7 0 0 0-4.2 1.34C4 9.3 3.3 13.1 3.65 16.86A16.8 16.8 0 0 0 8.8 19.5l.65-.9a11 11 0 0 1-1.7-.83l.42-.32a11.8 11.8 0 0 0 9.66 0l.42.32a11 11 0 0 1-1.7.83l.65.9a16.8 16.8 0 0 0 5.15-2.64c.42-4.35-.7-8.12-3.05-11.52ZM9.55 14.6c-1 0-1.83-.92-1.83-2.05 0-1.13.8-2.06 1.83-2.06s1.85.93 1.83 2.06c0 1.13-.81 2.05-1.83 2.05Zm4.9 0c-1 0-1.83-.92-1.83-2.05 0-1.13.8-2.06 1.83-2.06s1.84.93 1.83 2.06c0 1.13-.8 2.05-1.83 2.05Z",
  },
  {
    name: "LinkedIn",
    body: "Connect with Industry Experts and like Minded Individuals",
    href: "https://www.linkedin.com/company/sparkchapter/",
    hover: "group-hover:text-sky-400",
    ring: "group-hover:border-sky-400/60",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.4 21.5h5.16V9.75H2.4V21.5Zm7.42 0h5.16v-6.19c0-1.63.31-3.2 2.32-3.2 1.99 0 2.02 1.85 2.02 3.3v6.09h5.16v-7.12c0-4.46-.96-7.4-6.18-7.4-2.5 0-4.19 1.38-4.88 2.68h-.07V9.75H9.82V21.5Z",
  },
  {
    name: "Instagram",
    body: "Follow up on our Events and Progress",
    href: "https://www.instagram.com/sparkchapter?igsh=dzZzMG01NjAxbmNi",
    hover: "group-hover:text-pink-500",
    ring: "group-hover:border-pink-500/60",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.03a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z",
  },
  {
    name: "WhatsApp",
    body: "Ask Questions and get Resources curated for Community",
    href: "https://chat.whatsapp.com/FYSriy557mw7FTKxWGprfS",
    hover: "group-hover:text-emerald-500",
    ring: "group-hover:border-emerald-500/60",
    path: "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35ZM12.05 22a9.9 9.9 0 0 1-5.04-1.38l-3.52.92.94-3.43A9.93 9.93 0 1 1 12.05 22Z",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex h-screen w-full flex-col bg-gradient-to-b from-black via-background to-purple-950">
        <StarryCanvas />
        <div className="z-10 flex h-full flex-col items-center justify-center px-4">
          <h1 className="text-center text-7xl font-extrabold md:text-8xl">
            {/* Per-line reveal on the original swipe curve, 140ms apart. */}
            <span className="animation-swipe-from-bottom block">Here Ideas</span>
            <span
              className="animation-swipe-from-bottom block"
              style={{ animationDelay: "140ms" }}
            >
              Spark into Reality
            </span>
          </h1>
          <p className="animation-fade-in font-poppins mt-4 px-10 text-center text-lg">
            The <b>Fastest</b> Growing Innovation Community of Pakistan
          </p>
        </div>
      </section>

      {/* How it all started */}
      <section className="relative flex w-full flex-row bg-gradient-to-b from-purple-950 to-slate-950">
        <Image
          src="/images/logo-white.png"
          alt=""
          width={384}
          height={384}
          aria-hidden
          className="pointer-events-none absolute top-16 right-6 h-96 w-auto object-contain opacity-30 [animation:spin_120s_linear_infinite] motion-reduce:animate-none"
        />
        <div className="relative container px-10 py-40">
          <Reveal>
            <h2 className="mb-8 text-left text-5xl font-bold opacity-70 md:text-8xl">
              How it all <br /> started...
            </h2>
          </Reveal>

          <div className="mx-auto max-w-3xl">
            <Reveal delay={80}>
              <p className="mb-4 text-lg text-gray-300">
                SPARK is Pakistan&apos;s premier innovation community, dedicated to
                fostering creativity, entrepreneurship, and technological
                advancement across the nation.
              </p>
            </Reveal>
            <Reveal delay={160}>
              <p className="mb-4 text-lg text-gray-300">
                Our mission is to empower individuals and institutions to turn their
                groundbreaking ideas into reality, contributing to Pakistan&apos;s
                growth and global competitiveness.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <p className="text-lg text-gray-300">
                We provide a platform for innovators, entrepreneurs, and students to
                connect, collaborate, and create, driving positive change in society
                and the economy through innovation and impact.
              </p>
            </Reveal>
            <Reveal delay={320}>
              <Link href="/mission" className="btn-stylized mt-10">
                Learn More
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Our Impact */}
      <section className="relative w-full bg-gradient-to-b from-slate-950 to-background px-10 py-20">
        <Reveal>
          <h2 className="mb-12 text-center text-7xl font-bold opacity-70">
            Our Impact
          </h2>
        </Reveal>

        <Stagger
          step={100}
          className="flex flex-wrap place-content-center gap-x-10"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-16 text-center transition duration-300 hover:scale-105"
            >
              <CountUp
                value={stat.value}
                className="mb-2 block bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-9xl font-bold text-transparent"
              />
              <div className="text-xl text-gray-300">{stat.label}</div>
            </div>
          ))}
        </Stagger>
      </section>

      {/* Sponsors */}
      <section className="flex w-full flex-col items-center gap-20 bg-gradient-to-b from-background to-black py-16">
        <Reveal>
          <h2 className="text-center text-xl font-bold">Sponsors and Partners</h2>
        </Reveal>

        <Stagger
          step={90}
          className="flex flex-wrap items-center justify-center gap-20 p-10"
        >
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.name}
              className="group flex w-72 flex-col items-center gap-5 rounded-xl p-6 transition-all duration-300 hover:scale-110 hover:bg-slate-900"
            >
              <Image
                src={sponsor.logo}
                alt={sponsor.name}
                width={160}
                height={80}
                className="h-20 w-auto object-contain grayscale transition-all duration-500 group-hover:grayscale-0"
              />
              <p className="text-xs">{sponsor.name}</p>
            </div>
          ))}
        </Stagger>
      </section>

      {/* Become a Member */}
      <section className="relative w-full py-16">
        <div
          className="absolute inset-0 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 opacity-30"
          aria-hidden
        />
        <div
          className="gradient-pan absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500"
          aria-hidden
        />
        <div
          className="gradient-pan absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500"
          aria-hidden
        />

        <div className="relative z-10 container mx-auto px-4">
          <Reveal>
            <h2 className="mb-12 text-center text-4xl font-bold text-white">
              Become a Member
            </h2>
          </Reveal>

          <div className="flex flex-col items-center justify-between text-center md:flex-row">
            <div className="mb-8 md:mb-0 md:w-1/2">
              <Reveal>
                <h3 className="mb-6 text-left text-2xl font-semibold">
                  Why Join SPARK?
                </h3>
              </Reveal>
              <Stagger step={90} className="space-y-4 text-left text-gray-300">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start">
                    <svg
                      className="mr-3 size-6 shrink-0 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>{benefit}</span>
                  </div>
                ))}
              </Stagger>
            </div>

            <div className="md:w-1/2 md:pl-12">
              <Reveal delay={120}>
                <div className="rounded-xl border border-purple-600 bg-black/30 p-8 text-center shadow-xl backdrop-blur-lg transition-transform duration-500 hover:-translate-y-1">
                  <h3 className="mb-4 text-2xl font-semibold text-white">
                    Ready to Ignite Your Ideas?
                  </h3>
                  <p className="mb-6 text-gray-300">
                    Join SPARK today and be part of Pakistan&apos;s fastest-growing
                    innovation community!
                  </p>
                  <Link href="/signup" className="btn-stylized">
                    Register Now
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Join Our Community */}
      <section className="relative z-10 flex w-full flex-col items-center bg-background px-10 py-32">
        <div
          className="float-drift absolute -z-10 h-32 w-1/2 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 opacity-50 blur-3xl"
          style={{
            ["--drift-duration" as string]: "18s",
            ["--drift-x" as string]: "40px",
            ["--drift-y" as string]: "-20px",
          }}
          aria-hidden
        />

        <Reveal>
          <h2 className="text-center text-5xl font-bold">Join Our Community!</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-8 text-center">
            Join Our Community of Innovative and Talented Individuals across various
            Social Platforms <br />
            and be a part of something Big!
          </p>
        </Reveal>

        <Stagger
          step={90}
          className="mt-20 flex flex-row flex-wrap items-center justify-center gap-4"
        >
          {communities.map((c) => (
            <div
              key={c.name}
              className={`group flex w-80 flex-col gap-4 rounded-3xl border border-transparent bg-slate-950 p-10 text-center transition-all duration-300 hover:scale-105 ${c.ring}`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`mx-auto size-14 fill-current transition-all duration-500 group-hover:-translate-y-1 ${c.hover}`}
                aria-hidden
              >
                <path d={c.path} />
              </svg>
              <h3
                className={`text-2xl font-bold text-white transition-colors duration-500 ${c.hover}`}
              >
                {c.name}
              </h3>
              <p>{c.body}</p>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto rounded-lg border border-white/30 px-4 py-2 transition-colors hover:bg-white/10"
              >
                Join Now
              </a>
            </div>
          ))}
        </Stagger>
      </section>
    </>
  );
}
