import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Play,
  Sparkles,
  Check,
  ArrowRight,
  Zap,
  Crown,
  Rocket,
  ChevronDown,
  Download,
  Monitor,
  Smartphone,
  Library,
  Eye,
  ClipboardCopy,
  Clipboard,
  LayoutGrid,
  Lock,
  Palette,
  type LucideIcon,
} from "lucide-react";
import linkeeLogo from "@/assets/linkee-logo.png";
import fireGif from "@/assets/fire.gif";
import CurvedLoop from "@/components/CurvedLoop";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linkee — Your YouTube, organized beautifully" },
      {
        name: "description",
        content:
          "Paste YouTube videos, shorts, channels and posts. Watch, sort, filter and export — all from one beautiful dashboard.",
      },
      { property: "og:title", content: "Linkee — Your YouTube, organized beautifully" },
      {
        property: "og:description",
        content: "Paste YouTube videos, shorts, channels and posts. One dashboard for it all.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  useEffect(() => {
    const stored = localStorage.getItem("tubedeck.theme");
    const prefersDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={linkeeLogo} alt="Linkee" className="h-7 w-auto invert" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black shadow-md transition-all hover:scale-105"
          >
            Get Lifetime Access
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pt-24 pb-28 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]" />

        <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/80 backdrop-blur">
          <img src={fireGif} alt="" className="h-4 w-4" />
          Introducing Linkee — Tame your YouTube
        </div>

        <h1
          className="mt-8 animate-fade-in text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent leading-[1.05]"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          Your YouTube, organized<br />beautifully in one place.
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl animate-fade-in text-base text-white/60 sm:text-lg"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          Paste links to videos, shorts, channels and community posts. Watch in theatre mode,
          sort by channel, filter what's left — all from one calm dashboard.
        </p>

        <div
          className="mt-10 flex animate-fade-in flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "0.3s", animationFillMode: "both" }}
        >
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition-all hover:scale-105"
          >
            <Rocket className="h-4 w-4" />
            Launch Linkee — it's free
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
          >
            See what it does
          </a>
        </div>

        {/* Hero mock */}
        <div
          className="mx-auto mt-20 max-w-4xl animate-fade-in"
          style={{ animationDelay: "0.4s", animationFillMode: "both" }}
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-2xl backdrop-blur">
            <div className="rounded-xl bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.04] p-10">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { l: "Videos", n: 42 },
                  { l: "Shorts", n: 18 },
                  { l: "Channels", n: 7 },
                  { l: "Posts", n: 3 },
                ].map((c, idx) => (
                  <div
                    key={c.l}
                    className="rounded-xl border border-white/10 bg-black/40 p-5 text-left transition-transform hover:-translate-y-1"
                    style={{ animation: `fade-in 0.6s ease-out ${0.5 + idx * 0.1}s both` }}
                  >
                    <div className="text-3xl font-bold text-white">{c.n}</div>
                    <div className="mt-1 text-xs uppercase tracking-wider text-white/50">{c.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <div className="text-center">
          <h2 className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            More and more...
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Every tool you need to keep your watchlist sane.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:bg-white/[0.06]"
              style={{ animation: `fade-in 0.5s ease-out ${i * 0.05}s both` }}
            >
              <div className="text-2xl">{f.emoji}</div>
              <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-white/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-24">
        <div className="text-center">
          <h2 className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Simple, honest pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Start free. Upgrade when you want more power.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-7 transition-all hover:-translate-y-1 ${
                p.featured
                  ? "border-white/30 bg-gradient-to-b from-white/[0.08] to-white/[0.02]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
              style={{ animation: `fade-in 0.5s ease-out ${i * 0.1}s both` }}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-white/60">
                {p.icon}
                {p.name}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">{p.price}</span>
                {p.period && <span className="text-sm text-white/50">/{p.period}</span>}
              </div>
              <p className="mt-2 text-sm text-white/60">{p.tagline}</p>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/app"
                className={`mt-7 flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] ${
                  p.featured
                    ? "bg-white text-black"
                    : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {p.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-24">
        <div className="text-center">
          <h2 className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Frequently asked
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Everything you might want to know before you start.
          </p>
        </div>
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-5 pb-10 pt-16">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src={linkeeLogo} alt="Linkee" className="h-6 w-auto invert" />
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/60">
              Linkee keeps your YouTube videos, shorts, channels and posts beautifully organized in one calm dashboard.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://x.com/provanshh"
                target="_blank"
                rel="noreferrer noopener"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="X"
              >
                𝕏
              </a>
              <a
                href="https://www.linkedin.com/in/provanshh/"
                target="_blank"
                rel="noreferrer noopener"
                className="text-white/60 hover:text-white transition-colors text-sm"
                aria-label="LinkedIn"
              >
                in
              </a>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Product</div>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><Link to="/app" className="hover:text-white">Open app</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Company</div>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><a href="https://x.com/provanshh" target="_blank" rel="noreferrer noopener" className="hover:text-white">Contact</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Legal</div>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <div>© {new Date().getFullYear()} Linkee. All rights reserved.</div>
          <div>
            Built with <span className="text-rose-400">♥</span> by{" "}
            <a href="https://x.com/provanshh" target="_blank" rel="noreferrer noopener" className="underline hover:text-white">
              @provanshh
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:bg-white/[0.05]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-sm font-medium text-white sm:text-base">{q}</span>
        <ChevronDown className={`h-4 w-4 text-white/60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-white/60 animate-fade-in">{a}</div>
      )}
    </div>
  );
}

const FEATURES = [
  { emoji: "🎬", title: "Theatre, small or fullscreen", desc: "Three player modes. Switch instantly without losing your place." },
  { emoji: "📱", title: "Shorts done right", desc: "Vertical player with next/previous — like the real app, minus the noise." },
  { emoji: "📚", title: "Videos, Shorts, Channels, Posts", desc: "One place for everything you save. Auto-categorized when you paste." },
  { emoji: "👁️", title: "Filter what's left", desc: "Hide watched, see only what's left, or sort by channel in one click." },
  { emoji: "📋", title: "Copy & export", desc: "Copy every link grouped by category, or export your whole library to PDF." },
  { emoji: "⚡", title: "Paste anywhere", desc: "Just hit Ctrl+V anywhere in the app — Linkee figures the rest out." },
  { emoji: "🪟", title: "Three views", desc: "Gallery, list and compact — match how you want to scan your library." },
  { emoji: "🔒", title: "Local-first", desc: "Your library lives in your browser. No account, no tracking, no waiting." },
  { emoji: "✨", title: "Beautiful, dark or light", desc: "A calm interface that gets out of your way. Switches with your system." },
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

const FAQS = [
  { q: "What is Linkee?", a: "Linkee is a beautiful dashboard for organizing YouTube videos, shorts, channels and community posts. Paste a link and it auto-categorizes — then watch, sort, filter and export." },
  { q: "Do I need an account?", a: "No. Linkee is local-first — your library lives in your browser. No sign-up, no tracking, no waiting." },
  { q: "What kind of YouTube links can I save?", a: "Videos, shorts (youtube.com/shorts/...), channels (youtube.com/@handle) and community posts (youtube.com/post/...) — all auto-detected and sorted." },
  { q: "Can I export my library?", a: "Yes. Export the whole database to PDF, or copy all links grouped by category from the settings menu." },
  { q: "Is Linkee really free?", a: "The Free plan is free forever and includes everything you need. Pro adds cloud sync and queue features for power viewers." },
  { q: "Who built Linkee?", a: "Linkee is built by Provansh — an indie maker. You can reach out on X (@provanshh) or LinkedIn." },
];
