import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from "react";
import {
  Sparkles,
  Check,
  ArrowRight,
  Zap,
  Rocket,
  ChevronDown,
  Monitor,
  Smartphone,
  Library,
  Eye,
  ClipboardCopy,
  Clipboard,
  LayoutDashboard,
  Lock,
  Palette,
  X,
  Menu,
  Mail,
  KeyRound,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import linkeeLogo from "@/assets/linkee-logo.png";
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
  const [authOpen, setAuthOpen] = useState<null | "login" | "signup">(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [carouselPosition, setCarouselPosition] = useState(FEATURES.length);
  const [carouselTransition, setCarouselTransition] = useState(true);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("tubedeck.theme");
    return stored ? stored === "dark" : true;
  });
  const featureCarouselRef = useRef<HTMLDivElement>(null);
  const featureCount = FEATURES.length;
  const carouselItems = [...FEATURES, ...FEATURES, ...FEATURES];
  const activeFeature = ((carouselPosition - featureCount) % featureCount + featureCount) % featureCount;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      setCarouselWidth(featureCarouselRef.current?.clientWidth ?? 0);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCarouselPosition((position) => position + 1);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (carouselPosition < featureCount * 2) return;
    const timeout = window.setTimeout(() => {
      setCarouselTransition(false);
      setCarouselPosition(featureCount);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setCarouselTransition(true));
      });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [carouselPosition, featureCount]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full pointer-events-none">
        <div
          className={`w-full transition-all duration-500 ease-in-out pointer-events-none ${
            isScrolled ? "pt-4 px-4 md:px-8" : "pt-0 px-0"
          }`}
        >
          <div
            className={`relative mx-auto flex w-full items-center justify-between gap-3 transition-all duration-500 ease-in-out pointer-events-auto ${
              isScrolled
                ? "max-w-3xl rounded-full border border-white/10 bg-black/75 backdrop-blur-3xl px-6 py-2.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] shadow-black/50"
                : "max-w-6xl rounded-none border-0 bg-black/35 text-white backdrop-blur-3xl px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            }`}
          >
            <Link to="/" className="flex items-center gap-2">
              <img src={linkeeLogo} alt="Linkee" className="h-8 w-auto invert" />
            </Link>
            <nav className="hidden items-center gap-8 text-base text-white/75 md:flex">
              <a href="#video" className="hover:text-white transition-colors">About</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </nav>
            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={() => setAuthOpen("login")}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition-all hover:scale-105 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                Log in / Sign up
              </button>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center bg-transparent p-0 text-white transition-colors hover:text-white/80 md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
            {menuOpen && (
              <div className="absolute right-4 top-full mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur-2xl md:hidden">
                <div className="flex flex-col gap-1 text-sm text-white/80">
                  <a href="#video" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2 transition-colors hover:bg-white/5 hover:text-white">About</a>
                  <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2 transition-colors hover:bg-white/5 hover:text-white">Features</a>
                  <a href="#pricing" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2 transition-colors hover:bg-white/5 hover:text-white">Pricing</a>
                  <a href="#faq" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2 transition-colors hover:bg-white/5 hover:text-white">FAQ</a>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthOpen("login");
                  }}
                  className="mt-3 w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:scale-[1.01]"
                >
                  Log in / Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-5 pt-24 pb-16 text-center sm:pt-28 sm:pb-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent_60%)]" />

        <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/80 backdrop-blur-xl">
          Introducing Linkee — Tame your YouTube
        </div>

        <h1
          className="mt-10 animate-fade-in text-4xl font-bold tracking-tight leading-[1.05] bg-gradient-to-b from-white via-white to-white/35 bg-clip-text text-transparent sm:text-6xl md:text-7xl"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          Your YouTube, organized<br />beautifully in one place.
        </h1>

        <p
          className="mx-auto mt-8 hidden max-w-3xl animate-fade-in text-lg text-white/60 sm:block sm:text-xl"
          style={{ animationDelay: "0.2s", animationFillMode: "both" }}
        >
          Paste links to videos, shorts, channels and community posts. Watch in theatre mode,
          sort by channel, filter what's left — all from one calm dashboard.
        </p>

        <div
          className="mt-12 flex animate-fade-in flex-col items-center justify-center gap-4 sm:flex-row"
          style={{ animationDelay: "0.3s", animationFillMode: "both" }}
        >
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-black shadow-lg transition-all hover:scale-105"
          >
            <Rocket className="h-5 w-5" />
            Launch Linkee — it's free
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-medium text-white transition-all hover:bg-white/10"
          >
            See what it does
          </a>
        </div>

        {/* Curved marquee */}
        <div
          className="mt-5 animate-fade-in sm:mt-0"
          style={{ animationDelay: "0.35s", animationFillMode: "both" }}
        >
          <CurvedLoop
            marqueeText="Paste ✦ Watch ✦ Organize ✦ Export ✦ Linkee ✦"
            speed={1.5}
            curveAmount={300}
            className="fill-white/80"
          />
        </div>

        {/* Hero video */}
        <div
          id="video"
          className="mx-auto mt-24 max-w-6xl animate-fade-in sm:mt-46"
          style={{ animationDelay: "0.4s", animationFillMode: "both" }}
        >
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-2xl backdrop-blur">
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
                title="Linkee demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>


      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
        <div className="text-center">
          <h2 className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
            More and more...
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/60">
            Every tool you need to keep your watchlist sane.
          </p>
        </div>
        <div className="mt-10 px-0 sm:mt-12 sm:px-4 lg:px-10">
          <div ref={featureCarouselRef} className="overflow-hidden">
            <div
              className={`flex ${carouselTransition ? "transition-transform duration-700 ease-out" : ""}`}
              style={{
                transform: `translateX(-${
                  carouselWidth
                    ? carouselWidth < 768
                      ? carouselPosition * carouselWidth
                      : (carouselPosition - 1) * (carouselWidth / 3)
                    : 0
                }px)`,
              }}
            >
              {carouselItems.map((f, index) => {
                const Icon = f.icon;
                const isActive = index === carouselPosition;
                const itemWidth = carouselWidth ? (carouselWidth < 768 ? carouselWidth : carouselWidth / 3) : 0;
                return (
                  <div
                    key={`${f.title}-${index}`}
                    className="shrink-0 px-1.5 sm:px-3 lg:px-4"
                    style={{ width: itemWidth ? `${itemWidth}px` : "100%" }}
                  >
                    <div
                      className={`relative z-10 h-full rounded-3xl border p-4 sm:p-6 transition-all duration-700 ease-out transform-gpu ${
                        isActive
                          ? "border-white/25 bg-white/[0.08] shadow-2xl shadow-white/10"
                          : "border-white/10 bg-white/[0.03] opacity-80"
                      }`}
                    >
                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
                          isActive ? "bg-white text-black" : "bg-white/10 text-white"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-white sm:mt-5 sm:text-lg">{f.title}</h3>
                      <p className="mt-2 text-xs leading-5 text-white/60 sm:mt-3 sm:text-sm sm:leading-6">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-1.5">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCarouselPosition(featureCount + i)}
              aria-label={`Go to feature ${i + 1}`}
              className={`rounded-full transition-all ${
                i === activeFeature
                  ? "h-1.5 w-5 bg-white"
                  : "h-1.5 w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>



      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-5 py-16 sm:py-28">
        <div className="text-center">
          <h2 className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
            Simple, honest pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/60 sm:mt-5 sm:text-lg">
            Start free. Upgrade when you want more power.
          </p>
          <div className="mt-5 inline-flex items-center rounded-full border border-white/15 bg-white/5 p-1 text-xs font-medium text-white/70">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-4 py-1.5 transition-all ${billingCycle === "monthly" ? "bg-white text-black shadow-sm" : "hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-full px-4 py-1.5 transition-all ${billingCycle === "yearly" ? "bg-white text-black shadow-sm" : "hover:text-white"}`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="mx-auto mt-10 grid max-w-[720px] justify-items-center gap-1.5 md:mt-16 md:grid-cols-2 md:gap-3">
          {PLANS.map((p, i) => (
            <div
              key={p.name}
              className={`relative w-full max-w-[340px] rounded-2xl border p-5 transition-all hover:-translate-y-1 sm:max-w-[360px] sm:p-7 ${
                p.featured
                  ? "border-white/30 bg-gradient-to-b from-white/[0.08] to-white/[0.02]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
              style={{ animation: `fade-in 0.5s ease-out ${i * 0.1}s both` }}
            >
              {p.featured && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-white px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-black sm:-top-3 sm:px-3 sm:py-1 sm:text-[10px]">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-white/60 sm:text-sm">
                {p.icon}
                {p.name}
              </div>
              <div className="mt-3 flex items-baseline gap-1 sm:mt-4">
                {(() => {
                  const pricing = p.variants[billingCycle] ?? p.variants.monthly;
                  return (
                    <>
                      {pricing.oldPrice ? <span className="text-base font-medium text-white/45 line-through sm:text-lg">{pricing.oldPrice}</span> : null}
                      <span className="text-4xl font-bold text-white sm:text-5xl">{pricing.price}</span>
                      {pricing.period && <span className="text-xs text-white/50 sm:text-sm">/{pricing.period}</span>}
                    </>
                  );
                })()}
              </div>
              <p className="mt-2 text-xs text-white/60 sm:text-sm">{p.tagline}</p>
              {(() => {
                const pricing = p.variants[billingCycle] ?? p.variants.monthly;
                return pricing.note ? <p className="mt-1 text-[11px] font-medium text-amber-300 sm:text-xs">{pricing.note}</p> : null;
              })()}
              <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/80 sm:text-sm">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400 sm:h-4 sm:w-4" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/app"
                className={`mt-5 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02] sm:mt-7 sm:py-2.5 sm:text-sm ${
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
      <section id="faq" className="mx-auto max-w-4xl px-5 py-12 sm:py-15">
        <div className="text-center">
          <h2 className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
            Frequently asked
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/60">
            Everything you might want to know before you start.
          </p>
        </div>
        <div className="mt-14 space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-5 pb-10 pt-16">
        <div className="mx-auto hidden max-w-6xl gap-10 sm:grid sm:grid-cols-2 md:grid-cols-4">
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
            <ul className="mt-3 space-y-2 text-xs text-white/60 sm:mt-4 sm:space-y-2.5 sm:text-sm">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><Link to="/app" className="hover:text-white">Open app</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Company</div>
            <ul className="mt-3 space-y-2 text-xs text-white/60 sm:mt-4 sm:space-y-2.5 sm:text-sm">
              <li><a href="mailto:vs.vansh19@gmail.com" className="hover:text-white">Contact</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Legal</div>
            <ul className="mt-3 space-y-2 text-xs text-white/60 sm:mt-4 sm:space-y-2.5 sm:text-sm">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-6xl sm:hidden">
          <div>
            <div className="flex items-center gap-2">
              <img src={linkeeLogo} alt="Linkee" className="h-6 w-auto invert" />
            </div>
            <p className="mt-3 max-w-xs text-xs leading-5 text-white/60">
              Linkee keeps your YouTube videos, shorts, channels and posts beautifully organized in one calm dashboard.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-6 grid max-w-6xl grid-cols-3 gap-3 sm:hidden">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white">Product</div>
            <ul className="mt-2 space-y-1.5 text-[10px] leading-4 text-white/60">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><Link to="/app" className="hover:text-white">Open app</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white">Company</div>
            <ul className="mt-2 space-y-1.5 text-[10px] leading-4 text-white/60">
              <li><a href="mailto:vs.vansh19@gmail.com" className="hover:text-white">Contact</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white">Legal</div>
            <ul className="mt-2 space-y-1.5 text-[10px] leading-4 text-white/60">
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
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

      <AuthDialog mode={authOpen} onClose={() => setAuthOpen(null)} onSwitch={(m) => setAuthOpen(m)} />
    </div>
  );
}

function AuthDialog({
  mode,
  onClose,
  onSwitch,
}: {
  mode: null | "login" | "signup";
  onClose: () => void;
  onSwitch: (m: "login" | "signup") => void;
}) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mode) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode, onClose]);

  if (!mode) return null;

  const isSignup = mode === "signup";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    onClose();
    navigate({ to: "/app" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 z-0 bg-black/70 backdrop-blur-md" />
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_70%)]" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-7 pt-8 pb-7">
          <img src={linkeeLogo} alt="Linkee" className="h-6 w-auto invert" />
          <h2 className="mt-5 text-2xl font-semibold text-white">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-1.5 text-sm text-white/60">
            {isSignup
              ? "Start organizing your YouTube in one calm place."
              : "Sign in to pick up where you left off."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {isSignup && (
              <Field icon={UserIcon} type="text" placeholder="Your name" autoComplete="name" />
            )}
            <Field icon={Mail} type="email" placeholder="you@email.com" autoComplete="email" required />
            <Field
              icon={KeyRound}
              type="password"
              placeholder="Password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
            />

            {!isSignup && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-white/60 hover:text-white">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:scale-[1.01]"
            >
              {isSignup ? "Create account" : "Log in"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-white/40">
            <div className="h-px flex-1 bg-white/10" />
            or
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate({ to: "/app" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Continue without account
          </button>

          <p className="mt-6 text-center text-xs text-white/60">
            {isSignup ? "Already have an account?" : "New to Linkee?"}{" "}
            <button
              type="button"
              onClick={() => onSwitch(isSignup ? "login" : "signup")}
              className="font-semibold text-white underline-offset-2 hover:underline"
            >
              {isSignup ? "Log in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }) {
  return (
    <div className="group relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white/80" />
      <input
        {...props}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-white/40 transition-colors focus:border-white/30 focus:bg-white/[0.06] focus:outline-none"
      />
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

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Monitor, title: "Theatre, small or fullscreen", desc: "Three player modes. Switch instantly without losing your place." },
  { icon: Smartphone, title: "Shorts done right", desc: "Vertical player with next/previous — like the real app, minus the noise." },
  { icon: Library, title: "Videos, Shorts, Channels, Posts", desc: "One place for everything you save. Auto-categorized when you paste." },
  { icon: Eye, title: "Filter what's left", desc: "Hide watched, see only what's left, or sort by channel in one click." },
  { icon: ClipboardCopy, title: "Copy & export", desc: "Copy every link grouped by category, or export your whole library to PDF." },
  { icon: Clipboard, title: "Paste anywhere", desc: "Just hit Ctrl+V anywhere in the app — Linkee figures the rest out." },
  { icon: LayoutDashboard, title: "Three views", desc: "Gallery, list and compact — match how you want to scan your library." },
  { icon: Lock, title: "Local-first", desc: "Your library lives in your browser. No account, no tracking, no waiting." },
  { icon: Palette, title: "Beautiful, dark or light", desc: "A calm interface that gets out of your way. Switches with your system." },
];


type Plan = {
  name: string;
  icon: React.ReactNode;
  tagline: string;
  cta: string;
  featured: boolean;
  features: string[];
  variants: {
    monthly: {
      price: string;
      oldPrice?: string;
      period?: string;
      note?: string;
    };
    yearly?: {
      price: string;
      oldPrice?: string;
      period?: string;
      note?: string;
    };
  };
};

const PLANS: Plan[] = [
  {
    name: "Basic (Free for first 100 users only)",
    icon: <Zap className="h-4 w-4" />,
    tagline: "Everything you need to get organized.",
    cta: "Start free",
    featured: false,
    variants: {
      monthly: {
        price: "$0",
        oldPrice: "$4.99",
        period: "forever",
        note: "Price increases soon.",
      },
      yearly: {
        price: "$0",
        oldPrice: "$4.99",
        period: "forever",
        note: "Price increases soon.",
      },
    },
    features: [
      "Unlimited videos, shorts, channels, posts",
      "All four view modes",
      "Theatre & fullscreen player",
      "Local storage in your browser",
    ],
  },
  {
    name: "Pro",
    icon: <Sparkles className="h-4 w-4" />,
    tagline: "For power viewers who want sync.",
    cta: "Go Pro",
    featured: true,
    variants: {
      monthly: {
        price: "$4.99",
        oldPrice: "$9.99",
        period: "mo",
      },
      yearly: {
        price: "$39.99",
        oldPrice: "$60",
        period: "year",
      },
    },
    features: [
      "Everything in Free",
      "Cloud sync across devices",
      "Copy and export your library",
      "Bulk import from CSV",
      "Access to tracker dashboard and watch stats",
    ],
  },
];

const FAQS = [
  { q: "What is Linkee?", a: "Linkee is a beautiful dashboard for organizing YouTube videos, shorts, channels and community posts. Paste a link and it auto-categorizes — then watch, sort, filter and export." },
  { q: "Can I use Linkee locally in my browser?", a: "Yes. Linkee is local-first — your library stays in your browser. No tracking, no uploads, and no waiting." },
  { q: "What kind of YouTube links can I save?", a: "Videos, shorts (youtube.com/shorts/...), channels (youtube.com/@handle) and community posts (youtube.com/post/...) — all auto-detected and sorted." },
  { q: "Can I export my library?", a: "Yes. Export the whole database to PDF, or copy all links grouped by category from the settings menu." },
  { q: "Is Linkee really free?", a: "The Basic plan is free forever (for first 100 users only) and includes everything you need. Pro adds cloud sync and queue features for power viewers." },
  { q: "Who built Linkee?", a: "Linkee is built by Vansh Singla — an indie maker. You can reach out on X (@provanshh) or LinkedIn (@provanshh)." },
];
