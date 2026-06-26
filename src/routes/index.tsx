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
      <section className="relative flex min-h-[96vh] items-center overflow-hidden py-24">
        {/* Dynamic Background Image */}
        <div className="absolute inset-0 size-full select-none">
          <img
            src={heroBackdrop}
            alt=""
            width={1920}
            height={1080}
            className="size-full object-cover scale-105 transition-transform duration-[10000ms] ease-out animate-pulse-subtle"
            style={{ filter: "brightness(0.35) contrast(1.15)" }}
          />
          {/* Multi-layered cinematic gradient overlays */}
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 30%, rgba(192, 57, 43, 0.15), transparent 50%)" }} />
        </div>

        {/* Floating background ambient lights */}
        <div className="absolute top-1/4 left-1/12 size-[500px] -translate-y-1/2 rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/12 size-[600px] rounded-full bg-indigo-950/15 blur-[150px] pointer-events-none" />

        {/* Floating quality badge top-right */}
        <div className="absolute top-28 right-8 hidden xl:flex items-center gap-2.5 rounded-full border border-white/10 bg-black/60 px-5 py-2.5 backdrop-blur-xl shadow-2xl">
          <span className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2.5 bg-primary"></span>
          </span>
          <span className="text-xs font-bold text-white/90 uppercase tracking-widest">4K ULTRA HD · DOLBY ATMOS</span>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div className="max-w-3xl space-y-8 animate-hero-in">
            <Badge className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 shadow-[0_0_24px_rgba(192,57,43,0.15)] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-md">
              ✦ Now Streaming — 50,000+ Titles
            </Badge>
            
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl text-white drop-shadow-2xl">
              Cinematic magic, <br />
              <span className="text-gradient bg-gradient-to-r from-primary via-red-500 to-amber-500 font-extrabold">on demand.</span>
            </h1>
            
            <p className="max-w-2xl text-lg sm:text-xl text-foreground/80 leading-relaxed font-normal">
              Unlimited movies, award-winning originals, and live events. Stream in breathtaking <span className="text-white font-semibold">4K HDR</span> & <span className="text-white font-semibold">Dolby Atmos</span> starting at just <span className="text-white font-semibold">₹167/month</span>.
            </p>
            
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="lg" asChild className="relative group overflow-hidden bg-primary hover:bg-primary/95 text-white font-bold text-base px-9 py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_32px_rgba(192,57,43,0.4)]">
                <Link to="/signup">
                  {/* Subtle inner light reflection */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Play className="mr-2.5 size-5 fill-white" /> Start Watching
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8 py-6 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                <Link to="/pricing">Explore Plans</Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground/60 font-medium pt-2">
              <span className="flex items-center gap-2">
                <Check className="size-4 text-primary shrink-0" /> 7-Day Free Trial
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-primary shrink-0" /> No Card Required
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-primary shrink-0" /> Cancel Anytime
              </span>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background to-transparent" />
      </section>

      <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:px-8">

        {/* ── Features ── */}
        <section className="py-8">
          <div className="mb-14 text-center space-y-3">
            <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/15 uppercase tracking-widest text-xs px-3.5 py-1">Why StreamVault</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">Everything you need to stream smarter</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">Built for people who take their entertainment seriously.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-white/[0.01] p-8 transition-all duration-500 hover:border-primary/40 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-sm"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                <div className="relative inline-flex size-14 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-primary transition-all duration-500 group-hover:scale-110 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:shadow-[0_0_30px_rgba(192,57,43,0.3)]">
                  <f.icon className="size-7" />
                </div>
                <h3 className="relative mt-6 font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">{f.title}</h3>
                <p className="relative mt-3 text-sm text-muted-foreground leading-relaxed font-normal">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trending Now ── */}
        <section className="py-4">
          <div className="mb-6 flex items-end justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2.5 bg-primary"></span>
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Trending This Week</h2>
              </div>
              <p className="text-sm text-muted-foreground pl-5">What everyone's watching right now</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary transition-colors">
              <Link to="/browse" className="flex items-center gap-1.5 font-semibold">View all <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <TitleRow heading="" titles={trendingMovies} />
        </section>

        {/* ── New Releases ── */}
        <section className="py-4">
          <div className="mb-6 flex items-end justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">New</span>
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">New Releases</h2>
              </div>
              <p className="text-sm text-muted-foreground">Fresh titles added this month</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary transition-colors">
              <Link to="/library" className="flex items-center gap-1.5 font-semibold">Browse all <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <TitleRow heading="" titles={newReleaseMovies} />
        </section>

        {/* ── Enjoy on TV Section (Netflix Style) ── */}
        <section className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center py-10">
          <div className="order-2 lg:order-1 relative flex flex-col items-center">
            {/* Cinematic Ambient Glow behind the display */}
            <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-primary/20 via-indigo-900/10 to-purple-900/20 opacity-40 blur-3xl animate-glow-pulse animate-duration-10000" />
            
            {/* Minimalist Cinematic Display Screen */}
            <div className="relative w-full max-w-[550px] aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/15 group">
              <TvVideo src={tvVideoUrl} />
              
              {/* Cinematic reflections and overlays */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-white/5 to-white/10 opacity-70 group-hover:opacity-40 transition-opacity duration-700" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-black/65 backdrop-blur-md px-4 py-3 border border-white/10 shadow-lg translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <div className="flex items-center gap-3">
                  <span className="size-2.5 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Now Playing — 4K Stream</span>
                </div>
                <span className="text-[10px] text-white/60 font-semibold px-2 py-0.5 bg-white/10 rounded-full">HDR 10+</span>
              </div>
            </div>
            
            {/* Sleek metallic TV stand neck & base */}
            <div className="w-28 h-5 bg-gradient-to-b from-[#181822] to-[#0c0c10] border-t border-white/10 relative z-10 shadow-md" />
            <div className="w-48 h-2.5 bg-gradient-to-r from-[#1c1c28] via-[#242436] to-[#1c1c28] rounded-full relative z-10 shadow-xl border-t border-white/5" />
          </div>
          
          <div className="order-1 lg:order-2 space-y-6">
            <Badge className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary/10 text-xs px-3.5 py-1 font-semibold uppercase tracking-wider">
              Smart TV Streaming
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
              Enjoy on the big screen
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg font-normal">
              Watch on Smart TVs, PlayStation 5, Xbox Series X/S, Chromecast, Apple TV, Blu-ray players, and more. Our high-fidelity player delivers native 4K HDR playback and Dolby Atmos spatial audio for the ultimate theater experience right in your living room.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <span className="text-xs font-medium text-foreground/50 uppercase tracking-widest">Supported Formats:</span>
              <span className="text-xs font-bold text-white/80 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg">4K UHD</span>
              <span className="text-xs font-bold text-white/80 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg">HDR10+</span>
              <span className="text-xs font-bold text-white/80 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg">Dolby Atmos</span>
            </div>
          </div>
        </section>

        {/* ── Browse by Genre ── */}
        <section className="py-8">
          <div className="mb-12 text-center space-y-3">
            <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/15 uppercase tracking-widest text-xs px-3.5 py-1">Categories</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">Browse by Genre</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">Explore thousands of titles across every category, hand-picked for your mood.</p>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {genres.map((g) => (
              <Link
                key={g.name}
                to="/library"
                className="group relative overflow-hidden rounded-2xl aspect-[16/10] bg-card border border-white/5 shadow-2xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)] hover:border-primary/40"
              >
                <img
                  src={`/public/images/categories/${g.src}`}
                  alt={g.name}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  style={{ filter: "brightness(0.7) contrast(1.15)" }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-all duration-500 group-hover:from-black/95 group-hover:via-black/50" />
                {/* Shimmer line on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end">
                  <span className="text-lg font-bold text-white drop-shadow group-hover:text-primary transition-colors duration-300">{g.name}</span>
                  <span className="text-xs text-white/50 mt-1 font-medium transition-all group-hover:text-white/70">{g.count.toLocaleString()} titles</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-white/[0.005] p-8 sm:p-14 backdrop-blur-md relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-indigo-900/10 blur-[120px]" />

          <div className="mx-auto max-w-2xl text-center space-y-4 relative z-10">
            <Badge className="bg-success/10 text-success border border-success/30 hover:bg-success/15 uppercase tracking-widest text-xs px-3.5 py-1">Flexible Plans</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">Pick the plan that fits</h2>
            <p className="text-muted-foreground text-base">Switch or cancel anytime. All plans include our 7-day risk-free trial.</p>
          </div>
          
          <div className="mt-14 grid gap-8 md:grid-cols-3 relative z-10">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-500 ${
                  p.highlight
                    ? "border-primary bg-gradient-to-b from-primary/15 to-primary/[0.01] hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(192,57,43,0.25)]"
                    : "border-white/5 bg-gradient-to-b from-white/5 to-white/[0.01] hover:border-white/15 hover:-translate-y-1 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)]"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1.5 text-xs font-black text-white uppercase tracking-wider shadow-[0_0_24px_rgba(192,57,43,0.5)]">
                    Most Popular
                  </span>
                )}
                
                <h3 className="font-extrabold text-xl text-white">{p.name}</h3>
                
                <div className="mt-6 flex items-end gap-1">
                  <p className="text-5xl font-black tracking-tight text-white">₹{p.perMonthInr}</p>
                  <span className="mb-1 text-sm font-medium text-muted-foreground">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">₹{p.priceInr} billed {p.cadence.toLowerCase()}</p>
                
                <div className="mt-6 rounded-xl bg-white/5 border border-white/5 px-4 py-3.5 text-sm">
                  <span className="font-bold text-white">{p.quality}</span>
                  <span className="text-muted-foreground"> · {p.screens} screen{p.screens > 1 ? 's' : ''}</span>
                </div>
                
                <ul className="mt-7 flex-1 space-y-4">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm text-foreground/80">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" /> 
                      <span className="leading-tight">{feat}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`mt-8 w-full font-bold text-sm py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                    p.highlight 
                      ? "bg-primary hover:bg-primary/95 text-white shadow-[0_0_20px_rgba(192,57,43,0.3)]" 
                      : "bg-white/10 border border-white/10 hover:bg-white/15 text-white"
                  }`}
                  variant={p.highlight ? "default" : "secondary"}
                  asChild
                >
                  <Link to="/signup">Start Free Trial</Link>
                </Button>
              </div>
            ))}
          </div>
          
          <p className="mt-8 text-center text-xs text-muted-foreground relative z-10 font-medium">
            All plans include a 7-day free trial. Cancel before your trial ends and you won't be charged.
          </p>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-8">
          <div className="mb-12 text-center space-y-3">
            <Badge className="bg-warning/10 text-warning border border-warning/30 hover:bg-warning/15 uppercase tracking-widest text-xs px-3.5 py-1">Reviews</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">Loved by millions of viewers</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">Don't take our word for it — hear from our community of cinephiles.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="group relative flex flex-col rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-white/[0.01] p-8 transition-all duration-500 hover:border-primary/30 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.65)] backdrop-blur-sm"
              >
                {/* Subtle double quotation mark watermark */}
                <span className="absolute right-6 top-6 text-6xl font-serif text-white/[0.03] select-none pointer-events-none group-hover:text-primary/5 transition-colors duration-500">“</span>
                
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-warning text-warning transition-transform group-hover:scale-110" />
                  ))}
                </div>
                
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/80 italic font-normal">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                
                <div className="mt-6 flex items-center gap-3.5 pt-5 border-t border-white/5">
                  <img
                    src={`https://i.pravatar.cc/48?img=${t.avatarSeed}`}
                    alt={t.name}
                    className="size-11 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-primary/40 transition-all duration-500"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-extrabold text-white">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Watch Anywhere ── */}
        <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.005] p-8 sm:p-14 overflow-hidden relative backdrop-blur-md">
          {/* Subtle decorative glow */}
          <div className="pointer-events-none absolute -top-32 -right-32 size-80 rounded-full bg-primary/10 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-indigo-900/10 blur-[100px]" />
          
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center relative z-10">
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary/10 text-xs px-3.5 py-1 font-semibold uppercase tracking-wider">
                Multi-Platform Access
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">Stream on any screen, anywhere</h2>
              <p className="text-muted-foreground leading-relaxed text-base font-normal">
                Seamless handoff across all your devices. Start a blockbuster film on your living room Smart TV, continue on your mobile device during your commute, and finish watching on your laptop — right where you left off.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {DEVICES.map((d) => (
                  <div
                    key={d.label}
                    className="group flex items-center gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.02]"
                  >
                    <d.icon className="size-5 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                    <div>
                      <p className="text-xs font-bold text-white">{d.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 font-normal">{d.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-transparent blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.9)] bg-black group">
                <div className="w-full aspect-[16/10] overflow-hidden bg-black">
                  <TvVideo src={deviceVideoUrl} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                
                {/* Floating cinematic card overlay */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="rounded-2xl bg-black/60 backdrop-blur-xl p-4 border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-primary/30">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10">
                        <img src="https://picsum.photos/seed/svposter16/48/48" alt="" className="size-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white truncate">Toy Story 5</p>
                          <span className="text-[9px] font-semibold text-primary uppercase tracking-widest">Disney Premium</span>
                        </div>
                        <p className="text-[10px] text-white/50 mt-0.5">Now Resuming on Mobile</p>
                        <div className="mt-2.5 h-[3px] rounded-full bg-white/15">
                          <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-primary to-red-400 shadow-[0_0_8px_rgba(192,57,43,0.6)]" />
                        </div>
                      </div>
                      <div className="size-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer">
                        <Play className="size-4 fill-black text-black ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-8">
          <div className="mb-12 text-center space-y-3">
            <Badge className="bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 uppercase tracking-widest text-xs px-3.5 py-1">Support</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">Frequently asked questions</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">Everything you need to know before joining StreamVault.</p>
          </div>
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-4">
              {FAQ.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] px-7 transition-all duration-300 data-[state=open]:border-primary/30 data-[state=open]:bg-white/[0.04] data-[state=open]:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]"
                >
                  <AccordionTrigger className="text-left font-bold text-base hover:no-underline py-5 text-white hover:text-primary transition-colors">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-sm font-normal">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/30 p-12 sm:p-20 text-center backdrop-blur-md">
          {/* Dynamic background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-primary/10 blur-[100px]" />
          <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-indigo-900/10 blur-[100px]" />

          <div className="relative z-10 space-y-6">
            <Badge className="bg-primary/20 text-primary border border-primary/40 shadow-[0_0_16px_rgba(192,57,43,0.15)] px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full">
              ✦ Stream Instantly — Cancel Anytime
            </Badge>
            <h2 className="text-4xl font-black tracking-tight sm:text-6xl text-white">
              Ready to start watching?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed font-normal">
              Join 2.4M+ subscribers enjoying pristine 4K HDR entertainment. Start your 7-day free trial today.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4 justify-center items-center">
              <Button size="lg" asChild className="relative group overflow-hidden bg-white text-black hover:bg-white/95 font-extrabold px-10 py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-2xl cursor-pointer">
                <Link to="/signup">
                  {/* Subtle inner light reflection */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Play className="mr-2.5 size-5 fill-black" /> Start Free Trial
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="px-8 py-6 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                <Link to="/pricing">Compare Plans</Link>
              </Button>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-semibold text-white/50">
              <span>✓ UHD 4K & HDR 10+</span>
              <span>✓ Dolby Atmos Audio</span>
              <span>✓ Unlimited Downloads</span>
              <span>✓ 7-Day Free Trial</span>
            </div>
          </div>
        </section>

      </div>
    </MainLayout>
  );
}
