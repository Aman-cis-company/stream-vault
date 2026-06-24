import { Link } from "react-router-dom";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { plans, testimonials, genres, DUMMY_MOVIES } from "@/lib/mock-data";
import type { Title } from "@/lib/mock-data";
import { TitleRow } from "@/components/streaming/TitleRow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Play,
  Check,
  Tv,
  Download,
  Sparkles,
  ShieldCheck,
  Star,
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import Hls from "hls.js";
import apiClient from "@/services/api";
import { mapMovieToTitle } from "@/lib/movies";
import { BackendMovie } from "@/store/slices/moviesSlice";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";

const FEATURES = [
  { icon: Tv, title: "4K Ultra HD + HDR", desc: "Cinema-grade picture and Dolby Atmos spatial audio on every device." },
  { icon: Download, title: "Watch Offline", desc: "Download your favorites and stream anywhere, no internet required." },
  { icon: Sparkles, title: "Smart Recommendations", desc: "An AI-powered feed tuned to your taste that keeps getting better." },
  { icon: ShieldCheck, title: "Cancel Anytime", desc: "No contracts, no hidden fees. You're always in full control." },
];

const DEVICES = [
  { icon: Tv, label: "Smart TV", desc: "Samsung, LG, Sony, Apple TV, Fire TV" },
  { icon: Smartphone, label: "Mobile", desc: "iOS & Android — phones and tablets" },
  { icon: Laptop, label: "Web", desc: "Any browser, any OS, any screen size" },
  { icon: Monitor, label: "Desktop App", desc: "Windows & Mac native app with 4K" },
  { icon: Tablet, label: "Tablet", desc: "iPad, Galaxy Tab, Kindle Fire" },
  { icon: Zap, label: "Game Consoles", desc: "PlayStation 5, Xbox Series X/S" },
];

const FAQ = [
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes, absolutely. You can cancel your subscription at any time from your account dashboard, with no cancellation fees. You'll continue to have access until the end of your billing period.",
  },
  {
    q: "How many devices can I stream on simultaneously?",
    a: "It depends on your plan. Standard allows 2 simultaneous streams, Premium allows 4, and Cinephile allows 6. You can also download content for offline viewing on up to the same number of devices.",
  },
  {
    q: "What video quality is available?",
    a: "Standard plan offers Full HD (1080p). Premium and Cinephile plans offer 4K Ultra HD with HDR10, Dolby Vision, and Dolby Atmos spatial audio where available — delivering a true cinema experience.",
  },
  {
    q: "Can I download titles for offline viewing?",
    a: "Yes, Premium and Cinephile plan subscribers can download titles to watch offline on up to 4 or 6 devices respectively. Downloads are available for 30 days and remain playable for 48 hours once you start watching.",
  },
  {
    q: "How does the affiliate program work?",
    a: "Earn 20% recurring commission on every subscriber you refer, for as long as they remain a paying customer. Payouts are processed monthly with a minimum threshold of $25, with no cap on earnings.",
  },
  {
    q: "Is there a free trial?",
    a: "We offer a 7-day free trial for new subscribers on all plans. No credit card is required to start your trial, and you can cancel before the trial ends without being charged.",
  },
];

interface TvVideoProps {
  src: string;
}

function TvVideo({ src }: TvVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = src.includes(".m3u8") || src.includes("/hls/");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else {
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      autoPlay
      loop
      muted
      playsInline
    />
  );
}

export default function Landing() {
  const [moviesByCategory, setMoviesByCategory] = useState<Record<number, Title[]>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const movRes = await apiClient.get("/movies?status=published&limit=100");
      const movies: BackendMovie[] = movRes.data.data.movies ?? [];
      const byCat: Record<number, Title[]> = {};
      movies.forEach((m) => {
        const mapped = mapMovieToTitle(m);
        if (m.category_id) {
          if (!byCat[m.category_id]) byCat[m.category_id] = [];
          byCat[m.category_id].push(mapped);
        }
      });
      setMoviesByCategory(byCat);
    } catch {
      // show empty state on API failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time: re-fetch when movies change
  useSocketEvent(SOCKET_EVENTS.MOVIE_CREATED, load);
  useSocketEvent(SOCKET_EVENTS.MOVIE_UPDATED, load);
  useSocketEvent(SOCKET_EVENTS.MOVIE_DELETED, load);
  useSocketEvent(SOCKET_EVENTS.CONTENT_PUBLISHED, load);
  useSocketEvent(SOCKET_EVENTS.CONTENT_UNPUBLISHED, load);

  // Combine DB movies and DUMMY_MOVIES to ensure a rich landing page
  const dbMovies = Object.values(moviesByCategory).flat();
  const allMovies = [...dbMovies];
  DUMMY_MOVIES.forEach((dm) => {
    if (!allMovies.some((m) => m.name.toLowerCase() === dm.name.toLowerCase())) {
      allMovies.push(dm);
    }
  });

  const trendingMovies = allMovies.filter(
    (m) => m.category === "Trending" || m.trending === true
  );

  const newReleaseMovies = allMovies.filter(
    (m) => m.category === "New Releases" || m.newRelease === true
  );

  // Build HLS endpoints dynamically pointing to backend HLS directories
  const backendBase = (import.meta.env.VITE_API_URL as string || "http://localhost:5000/api/v1")
    .replace(/\/api\/v1\/?$/, "");
  
  // Use distinct local HLS animation video streams
  const tvVideoUrl = `${backendBase}/uploads/hls/video-46060afa-5de8-4053-ba36-5c11fbdba7a0/master.m3u8`; // Kung Fu Panda 4
  const deviceVideoUrl = `${backendBase}/uploads/hls/video-6b288930-5418-41e6-87e5-4ab73f76c6a8/master.m3u8`; // Toy Story 5

  return (
    <MainLayout flush>
      {/* ── Hero ── */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <img
          src={heroBackdrop}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 size-full object-cover scale-105"
          style={{ filter: "brightness(0.55)" }}
        />
        {/* Cinematic gradient layers */}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/10" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-background/60 to-transparent" />

        {/* Floating quality badge top-right */}
        <div className="absolute top-24 right-6 hidden sm:flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 backdrop-blur-md">
          <span className="size-2 rounded-full bg-primary animate-glow-pulse" />
          <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">4K HDR · Dolby Atmos</span>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl animate-hero-in">
            <Badge className="mb-5 bg-primary/20 text-primary border-primary/40 hover:bg-primary/20 shadow-[0_0_16px_rgba(192,57,43,0.25)] text-sm px-4 py-1">
              ✦ Now Streaming — 50,000+ Titles
            </Badge>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl drop-shadow-2xl">
              Stories worth{" "}
              <span className="text-gradient">staying in</span> for.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-foreground/75 leading-relaxed">
              Unlimited movies, award-winning originals, and live events — streaming in 4K HDR,
              starting at just <strong className="text-foreground">₹167/month</strong>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 font-bold text-base px-8 shadow-2xl">
                <Link to="/signup"><Play className="mr-2 size-5 fill-black" /> Start Watching</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild className="text-base px-7 bg-white/10 border border-white/20 hover:bg-white/20 text-white backdrop-blur-sm">
                <Link to="/pricing">View Plans</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
              <span>✓ 7-day free trial</span>
              <span>✓ No credit card required</span>
              <span>✓ Cancel anytime</span>
            </p>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">

        {/* ── Features ── */}
        <section>
          <div className="mb-10 text-center">
            <Badge className="mb-3 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">Why StreamVault</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to stream smarter</h2>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">Built for people who take their entertainment seriously.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative inline-flex size-12 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-all group-hover:bg-primary/22 group-hover:ring-primary/40 group-hover:shadow-[0_0_20px_rgba(192,57,43,0.2)]">
                  <f.icon className="size-6" />
                </span>
                <h3 className="relative mt-4 font-semibold text-base">{f.title}</h3>
                <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trending Now ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="size-2 rounded-full bg-primary animate-glow-pulse" />
                <h2 className="text-2xl font-bold tracking-tight">Trending This Week</h2>
              </div>
              <p className="text-sm text-muted-foreground pl-4">What everyone's watching right now</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/browse">View all <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
          <TitleRow heading="" titles={trendingMovies} />
        </section>

        {/* ── New Releases ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">New</span>
                <h2 className="text-2xl font-bold tracking-tight">New Releases</h2>
              </div>
              <p className="text-sm text-muted-foreground">Fresh titles added this month</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/library">Browse all <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
          <TitleRow heading="" titles={newReleaseMovies} />
        </section>

        {/* ── Enjoy on TV Section (Netflix Style) ── */}
        <section className="grid gap-8 lg:grid-cols-2 lg:gap-14 items-center">
          <div className="order-2 lg:order-1 relative flex flex-col items-center">
            {/* Ambient Backlight Glow matching Netflix/modern streaming feel */}
            <div className="absolute -inset-6 rounded-3xl bg-primary/20 opacity-30 blur-3xl animate-glow-pulse" />
            
            {/* TV Screen Container */}
            <div className="relative w-full max-w-[500px] aspect-[16/9] overflow-hidden rounded-xl border-[12px] border-[#18181f] bg-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/10">
              <TvVideo src={tvVideoUrl} />
              {/* Screen Glare reflection overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
            </div>
            
            {/* TV Stand Neck */}
            <div className="w-24 h-4 bg-[#121218] border-t border-white/5 relative z-10 shadow-lg" />
            
            {/* TV Stand Base */}
            <div className="w-40 h-2 bg-[#18181f] rounded-full relative z-10 shadow-xl" />
          </div>
          
          <div className="order-1 lg:order-2">
            <Badge className="mb-4 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
              Smart TV Streaming
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Enjoy on your TV
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-base">
              Watch on Smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players, and more. Our high-fidelity player delivers native 4K HDR playback and Dolby Atmos spatial audio for the ultimate theater experience right in your living room.
            </p>
          </div>
        </section>

        {/* ── Browse by Genre ── */}
        <section>
          <div className="mb-10 text-center">
            <Badge className="mb-3 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">Categories</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Browse by Genre</h2>
            <p className="mt-2 text-muted-foreground">Explore thousands of titles across every category</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {genres.map((g) => (
              <Link
                key={g.name}
                to="/library"
                className="group relative overflow-hidden rounded-2xl aspect-[16/9] bg-card border border-border/60 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] hover:border-primary/30"
              >
                <img
                  src={`/public/images/categories/${g.src}`}
                  alt={g.name}
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5 transition-all duration-300 group-hover:from-black/90" />
                {/* Shimmer on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
                  <span className="text-base font-bold text-white drop-shadow">{g.name}</span>
                  <span className="text-xs text-white/60 mt-0.5">{g.count.toLocaleString()} titles</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="rounded-2xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-8 sm:p-12 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-3 bg-success/15 text-success border-success/30 hover:bg-success/15">7-day free trial</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pick the plan that fits</h2>
            <p className="mt-2 text-muted-foreground">Switch or cancel anytime. No commitments, no surprises.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-300 ${
                  p.highlight
                    ? "border-primary shadow-glow bg-gradient-to-b from-primary/12 to-transparent hover:-translate-y-1"
                    : "border-border/70 bg-card hover:border-border hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.5)]"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1 text-xs font-bold text-primary-foreground shadow-glow-sm">
                    Most Popular
                  </span>
                )}
                <h3 className="font-bold text-lg">{p.name}</h3>
                <div className="mt-4 flex items-end gap-1">
                  <p className="text-4xl font-extrabold tracking-tight">₹{p.perMonthInr}</p>
                  <span className="mb-1 text-sm font-normal text-muted-foreground">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">₹{p.priceInr} billed {p.cadence.toLowerCase()}</p>
                <div className="mt-4 rounded-xl bg-secondary/50 border border-border/50 px-3 py-2.5 text-sm">
                  <span className="font-semibold">{p.quality}</span>
                  <span className="text-muted-foreground"> · {p.screens} screens</span>
                </div>
                <ul className="mt-5 flex-1 space-y-3">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" /> {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-7 w-full font-semibold ${p.highlight ? "shadow-glow-sm" : ""}`}
                  variant={p.highlight ? "default" : "secondary"}
                  asChild
                >
                  <Link to="/signup">Start Free Trial</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            All plans include a 7-day free trial. Cancel before your trial ends and you won't be charged.
          </p>
        </section>

        {/* ── Testimonials ── */}
        <section>
          <div className="mb-10 text-center">
            <Badge className="mb-3 bg-warning/15 text-warning border-warning/30 hover:bg-warning/15">Subscriber Reviews</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Loved by millions of viewers</h2>
            <p className="mt-2 text-muted-foreground">Don't take our word for it — hear from our subscribers</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="group flex flex-col rounded-2xl border border-border/70 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.5)]"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-warning text-warning" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/85 italic">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <div className="mt-5 flex items-center gap-3 pt-4 border-t border-border/50">
                  <img
                    src={`https://i.pravatar.cc/48?img=${t.avatarSeed}`}
                    alt={t.name}
                    className="size-10 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/40 transition-all"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Watch Anywhere ── */}
        <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/90 to-card/50 p-8 sm:p-12 overflow-hidden relative">
          {/* Subtle decorative glow */}
          <div className="pointer-events-none absolute -top-32 -right-32 size-80 rounded-full bg-primary/8 blur-3xl" />
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-14 items-center relative z-10">
            <div>
              <Badge className="mb-4 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
                Available everywhere
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Watch on any screen, anywhere</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Stream seamlessly across all your devices. Start a film on your TV,
                continue on your phone during your commute, and finish on your laptop — right where you left off.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {DEVICES.map((d) => (
                  <div
                    key={d.label}
                    className="group flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/30 px-3 py-3 transition-all hover:border-primary/30 hover:bg-primary/8"
                  >
                    <d.icon className="size-4 shrink-0 text-primary transition-transform group-hover:scale-110" />
                    <div>
                      <p className="text-xs font-semibold">{d.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{d.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-border/60 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.8)] bg-black">
                <div className="w-full aspect-[16/10] overflow-hidden bg-black">
                  <TvVideo src={deviceVideoUrl} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="rounded-2xl bg-black/55 backdrop-blur-xl p-3.5 border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10">
                        <img src="https://picsum.photos/seed/svposter16/44/44" alt="" className="size-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">Toy Story 5</p>
                        <p className="text-[10px] text-white/50 mt-0.5">Disney Original</p>
                        <div className="mt-1.5 h-[3px] rounded-full bg-white/15">
                          <div className="h-full w-2/5 rounded-full bg-primary shadow-[0_0_8px_rgba(192,57,43,0.6)]" />
                        </div>
                      </div>
                      <div className="size-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg">
                        <Play className="size-3.5 fill-black text-black ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <div className="mb-10 text-center">
            <Badge className="mb-3 bg-muted text-muted-foreground border-border hover:bg-muted">FAQ</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
            <p className="mt-2 text-muted-foreground">Everything you need to know before subscribing</p>
          </div>
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-2xl border border-border/70 bg-card/80 px-6 transition-all data-[state=open]:border-primary/40 data-[state=open]:bg-card data-[state=open]:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-5 hover:text-primary transition-colors">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 p-12 text-center">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/18 via-primary/8 to-transparent" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-primary/12 blur-3xl" />
          <div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10">
            <Badge className="mb-5 bg-primary/20 text-primary border-primary/40 shadow-[0_0_16px_rgba(192,57,43,0.2)] px-4 py-1">
              ✦ Join 2.4M+ subscribers
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Ready to start watching?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto text-lg leading-relaxed">
              Start your 7-day free trial today — no credit card required. Cancel anytime.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 font-bold px-9 text-base shadow-2xl">
                <Link to="/signup"><Play className="mr-2 size-5 fill-black" /> Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild className="px-7 text-base bg-white/10 border border-white/20 hover:bg-white/15 text-white backdrop-blur-sm">
                <Link to="/pricing">Compare Plans</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              ✓ 4K HDR &nbsp;·&nbsp; ✓ Dolby Atmos &nbsp;·&nbsp; ✓ Offline downloads &nbsp;·&nbsp; ✓ Cancel anytime
            </p>
          </div>
        </section>

      </div>
    </MainLayout>
  );
}
