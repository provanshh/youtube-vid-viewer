import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Play,
  Film,
  Clapperboard,
  Tv,
  FileText,
  Copy,
  Download,
  Eye,
  ArrowUpDown,
  Maximize2,
  Sparkles,
  Check,
  ArrowRight,
  Zap,
  Crown,
  Rocket,
} from "lucide-react";
import youtubeLogo from "@/assets/youtube-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TubeDeck — Your YouTube, organized beautifully" },
      {
        name: "description",
        content:
          "Paste YouTube videos, shorts, channels and posts. Watch, sort, filter and export — all from one beautiful dashboard.",
      },
      { property: "og:title", content: "TubeDeck — Your YouTube, organized beautifully" },
      {
        property: "og:description",
        content: "Paste YouTube videos, shorts, channels and posts. One dashboard for it all.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("tubedeck.theme");
    const prefersDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-rose-500/20 blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/15 blur-3xl animate-pulse"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={youtubeLogo} alt="TubeDeck" className="h-7 w-auto" />
            <span className="text-base font-semibold tracking-tight">TubeDeck</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#creator" className="hover:text-foreground transition-colors">Creator</a>
          </nav>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background shadow-md transition-all hover:shadow-lg hover:scale-105"
          >
            Open app <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-24 text-center">
        <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          A new way to watch YouTube
        </div>
        <h1
          className="mt-6 animate-fade-in text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          Your YouTube,{" "}
          <span className="bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
            organized beautifully
          </span>
        </h1>
        <p
          className="mx-auto mt-6 max-w-2xl animate-fade-in text-base text-muted-foreground sm:text-lg"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          Paste links to videos, shorts, channels and community posts. Watch in theatre mode,
          sort by channel, filter by what's left, export to PDF — all from one calm dashboard.
        </p>
        <div
          className="mt-10 flex animate-fade-in flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "0.3s", animationFillMode: "both" }}
        >
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <Rocket className="h-4 w-4" />
            Launch TubeDeck — it's free
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium shadow-sm transition-all hover:shadow-md"
          >
            See what it does
          </a>
        </div>

        {/* Hero mock */}
        <div
          className="mx-auto mt-16 max-w-4xl animate-fade-in"
          style={{ animationDelay: "0.4s", animationFillMode: "both" }}
        >
          <div className="rounded-2xl border border-border bg-card/80 p-2 shadow-2xl backdrop-blur hover-scale">
            <div className="rounded-xl bg-gradient-to-br from-rose-500/10 via-fuchsia-500/10 to-indigo-500/10 p-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { i: <Film className="h-5 w-5" />, l: "Videos", n: 42 },
                  { i: <Clapperboard className="h-5 w-5" />, l: "Shorts", n: 18 },
                  { i: <Tv className="h-5 w-5" />, l: "Channels", n: 7 },
                  { i: <FileText className="h-5 w-5" />, l: "Posts", n: 3 },
                ].map((c, idx) => (
                  <div
                    key={c.l}
                    className="rounded-xl border border-border bg-background/80 p-4 text-left shadow-sm transition-transform hover:-translate-y-1"
                    style={{
                      animation: `fade-in 0.6s ease-out ${0.5 + idx * 0.1}s both`,
                    }}
                  >
                    <div className="text-rose-500">{c.i}</div>
                    <div className="mt-2 text-2xl font-bold">{c.n}</div>
                    <div className="text-xs text-muted-foreground">{c.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need. Nothing you don't.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Built for people who watch a lot of YouTube and want it sorted.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ animation: `fade-in 0.5s ease-out ${i * 0.05}s both` }}
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-indigo-500/20 text-rose-500 transition-transform group-hover:scale-110">
                {f.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start free. Upgrade when you want more power. No surprises.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                p.featured
                  ? "border-rose-500/50 bg-gradient-to-br from-rose-500/10 via-fuchsia-500/5 to-indigo-500/10"
                  : "border-border bg-card/60 backdrop-blur"
              }`}
              style={{ animation: `fade-in 0.5s ease-out ${i * 0.1}s both` }}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-background shadow-md">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {p.icon}
                {p.name}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                {p.period && <span className="text-sm text-muted-foreground">/{p.period}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/app"
                className={`mt-7 flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] ${
                  p.featured
                    ? "bg-foreground text-background shadow-md hover:shadow-lg"
                    : "border border-border bg-card hover:bg-accent"
                }`}
              >
                {p.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Creator */}
      <section id="creator" className="mx-auto max-w-6xl px-4 py-20">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card/80 to-card/40 p-10 shadow-lg backdrop-blur sm:p-14">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-fuchsia-500 to-indigo-500 text-3xl font-bold text-white shadow-lg">
              P
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Built by
              </div>
              <h3 className="mt-1 text-2xl font-bold">Provansh</h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Indie maker. I built TubeDeck because my "Watch later" was a mess. Say hi —
                I reply to everyone.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href="https://x.com/provanshh"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm shadow-sm transition-all hover:scale-105 hover:shadow-md"
              >
                𝕏 @provanshh
              </a>
              <a
                href="https://www.linkedin.com/in/provanshh/"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm shadow-sm transition-all hover:scale-105 hover:shadow-md"
              >
                in/provanshh
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to tame your watchlist?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Open TubeDeck and paste your first link. Done in 5 seconds.
        </p>
        <Link
          to="/app"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <Play className="h-4 w-4" /> Open TubeDeck
        </Link>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TubeDeck · Built by{" "}
        <a href="https://x.com/provanshh" target="_blank" rel="noreferrer noopener" className="underline hover:text-foreground">
          @provanshh
        </a>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: <Play className="h-5 w-5" />,
    title: "Theatre, small or fullscreen",
    desc: "Three player modes. Switch instantly without losing your place.",
  },
  {
    icon: <Clapperboard className="h-5 w-5" />,
    title: "Shorts done right",
    desc: "Vertical player with next/previous swipe — like the real app, minus the noise.",
  },
  {
    icon: <Tv className="h-5 w-5" />,
    title: "Videos, Shorts, Channels, Posts",
    desc: "One place for everything you save. Auto-categorized when you paste.",
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: "Filter what's left",
    desc: "Hide watched, see only what's left, or sort by channel in one click.",
  },
  {
    icon: <Copy className="h-5 w-5" />,
    title: "Copy & export",
    desc: "Copy every link grouped by category, or export your whole library to PDF.",
  },
  {
    icon: <ArrowUpDown className="h-5 w-5" />,
    title: "Paste anywhere",
    desc: "Just hit Ctrl+V anywhere in the app — it figures the rest out.",
  },
  {
    icon: <Maximize2 className="h-5 w-5" />,
    title: "Three views",
    desc: "Gallery, list and compact — match how you want to scan your library.",
  },
  {
    icon: <Download className="h-5 w-5" />,
    title: "Local-first",
    desc: "Your library lives in your browser. No account, no tracking, no waiting.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Beautiful, dark or light",
    desc: "A calm interface that gets out of your way. Switches with your system.",
  },
];

const PLANS = [
  {
    name: "Free",
    icon: <Zap className="h-4 w-4" />,
    price: "$0",
    period: "forever",
    tagline: "Everything you need to get organized.",
    cta: "Start free",
    featured: false,
    features: [
      "Unlimited videos, shorts, channels, posts",
      "All three view modes",
      "Theatre & fullscreen player",
      "Copy links & PDF export",
      "Local-first — no account needed",
    ],
  },
  {
    name: "Pro",
    icon: <Sparkles className="h-4 w-4" />,
    price: "$4",
    period: "mo",
    tagline: "For power viewers who want sync.",
    cta: "Go Pro",
    featured: true,
    features: [
      "Everything in Free",
      "Cloud sync across devices",
      "Custom tags & collections",
      "Watch queue with autoplay",
      "Priority support",
    ],
  },
  {
    name: "Studio",
    icon: <Crown className="h-4 w-4" />,
    price: "$12",
    period: "mo",
    tagline: "For teams and creators.",
    cta: "Contact sales",
    featured: false,
    features: [
      "Everything in Pro",
      "Shared team libraries",
      "Bulk import from CSV",
      "Analytics & watch reports",
      "API access",
    ],
  },
];
