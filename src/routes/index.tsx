import { Link, useNavigate } from "react-router-dom";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { plans, testimonials, genres, DUMMY_MOVIES, TOP_10_INDIA_HINDI, type Plan } from "@/lib/mock-data";
import type { Title } from "@/lib/mock-data";
import { TitleRow } from "@/components/streaming/TitleRow";
import { Top10Row } from "@/components/streaming/Top10Row";
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
  Shield,
  CreditCard,
  Lock,
  X,
  Tv2,
  Crown,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import Hls from "hls.js";
import apiClient from "@/services/api";
import { mapMovieToTitle, fetchPlans, type BackendPlan } from "@/lib/movies";
import { BackendMovie } from "@/store/slices/moviesSlice";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";
import { useAuth } from "@/lib/auth";

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
    a: "Standard plan offers HD (720p). Premium and Cinephile plans offer Full HD (1080p) streaming.",
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let observer: IntersectionObserver | null = null;
    if (window.IntersectionObserver) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setVisible(entry.isIntersecting);
          });
        },
        { threshold: 0.05 }
      );
      observer.observe(video);
    } else {
      setVisible(true);
    }

    return () => {
      if (observer) {
        observer.unobserve(video);
        observer.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!visible) {
      video.pause();
      if (hlsRef.current) {
        hlsRef.current.stopLoad();
      }
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.startLoad();
      video.play().catch(() => {});
      return;
    }

    const isHls = src.includes(".m3u8") || src.includes("/hls/");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 15,
        backBufferLength: 5,
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
  }, [src, visible]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      loop
      muted
      playsInline
    />
  );
}

function mapBackendPlan(p: BackendPlan, index: number): Plan {
  const cadenceMap: Record<string, Plan["cadence"]> = { monthly: "Monthly", yearly: "Yearly" };
  const price = Number(p.price);
  const cadence = cadenceMap[p.billing_cycle] ?? "Monthly";
  const monthlyPrice = cadence === "Yearly" ? Math.round(price / 12) : price;
  return {
    id: String(p.id),
    backendPlanId: p.id,
    name: p.name,
    cadence,
    priceInr: price,
    perMonthInr: monthlyPrice,
    quality: p.quality
      ? (p.quality === "720" ? "HD 720p" : p.quality === "1080" ? "Full HD 1080p" : p.quality)
      : "Full HD 1080p",
    screens: p.max_screens ?? 2,
    features: Array.isArray(p.features_json)
      ? p.features_json
      : [`${cadence} billing`, "Unlimited streaming", "Cancel anytime"],
    highlight: index === 1,
  };
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plansList, setPlansList] = useState<Plan[]>(plans);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans()
      .then((data) => { if (data.length > 0) setPlansList(data.map(mapBackendPlan)); })
      .catch(() => {});
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { returnTo: "/" } });
      return;
    }
    setSelectedPlan(plan);
  };

  const handleCheckout = () => {
    if (!selectedPlan) return;
    navigate(`/checkout?plan_id=${selectedPlan.backendPlanId}`);
  };

  const [moviesByCategory, setMoviesByCategory] = useState<Record<number, Title[]>>({});
  const [loading, setLoading] = useState(true);
  const [top10Movies, setTop10Movies] = useState<Title[]>([]);
  const [top10Loading, setTop10Loading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [movRes, top10Res] = await Promise.all([
        apiClient.get("/movies?status=published&limit=100"),
        apiClient.get("/movies/top-10?language=Hindi").catch(() => null),
      ]);

      // Process all movies by category
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

      // Process Top 10 — real data first, fill with dummy fallback
      const top10Raw: BackendMovie[] = top10Res?.data?.data?.movies ?? [];
      const top10Mapped = top10Raw.map(mapMovieToTitle);
      if (top10Mapped.length < 5) {
        // Fill with dummy data if API doesn't have enough
        const existingNames = new Set(top10Mapped.map((m) => m.name.toLowerCase()));
        TOP_10_INDIA_HINDI.forEach((dm) => {
          if (!existingNames.has(dm.name.toLowerCase()) && top10Mapped.length < 10) {
            top10Mapped.push(dm);
            existingNames.add(dm.name.toLowerCase());
          }
        });
      }
      setTop10Movies(top10Mapped.slice(0, 10));
    } catch {
      // Fallback to dummy data on total API failure
      setTop10Movies(TOP_10_INDIA_HINDI);
    } finally {
      setLoading(false);
      setTop10Loading(false);
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
            <div className="text-xs font-black uppercase tracking-[0.25em] text-amber-500">
              STREAM MOVIES WITH
            </div>
            
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl text-white drop-shadow-2xl">
              Stream smarter with <br />
              <span className="text-gradient bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 font-extrabold">magic,</span> on demand.
            </h1>
            
            <p className="max-w-2xl text-lg sm:text-xl text-foreground/80 leading-relaxed font-normal">
              Unlimited movies, award-winning originals, and live events. Stream in breathtaking <span className="text-white font-semibold">4K HDR</span> & <span className="text-white font-semibold">Dolby Atmos</span> starting at just <span className="text-white font-semibold">₹167/month</span>.
            </p>
            
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="lg" variant="outline" asChild className="text-sm font-extrabold px-8 py-5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/45 text-white transition-all duration-300">
                <Link to="/browse">Explore Movies</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-sm font-extrabold px-8 py-5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/35 text-white transition-all duration-300">
                <Link to="/signup">Try for Free</Link>
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
        <section className="py-8 ambient-glow-blue">
          <div className="mb-14 text-center space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">FEATURES INDEX</div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground dark:text-white">Everything you need to stream smarter</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">Built for people who take their entertainment seriously.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, idx) => {
              const screenshotTitles = [
                "Smart streaming",
                "Multi-device",
                "Offline",
                "Greater content"
              ];
              const displayTitle = screenshotTitles[idx] || f.title;
              return (
                <div
                  key={f.title}
                  className="group relative rounded-2xl border border-border bg-card dark:border-white/5 dark:bg-gradient-to-b dark:from-white/5 dark:to-white/[0.01] p-8 transition-all duration-500 hover:border-primary/40 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-sm"
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  
                  <div className="relative inline-flex size-14 items-center justify-center rounded-xl bg-secondary border border-border text-primary transition-all duration-500 group-hover:scale-110 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:shadow-[0_0_30px_rgba(192,57,43,0.3)] dark:bg-white/5 dark:border-white/10">
                    <f.icon className="size-7" />
                  </div>
                  <h3 className="relative mt-6 font-bold text-lg text-foreground dark:text-white group-hover:text-primary transition-colors duration-300">{displayTitle}</h3>
                  <p className="relative mt-3 text-sm text-muted-foreground leading-relaxed font-normal">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Indian Movies ── */}
        <section className="py-4 ambient-glow-purple">
          <div className="mb-6 flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">HOT INDIAN RELEASES - 2026</div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black tracking-tight text-foreground dark:text-white sm:text-3xl">Indian Movies</h2>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary transition-colors">
              <Link to="/browse" className="flex items-center gap-1.5 font-semibold">View all <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <TitleRow heading="" titles={trendingMovies} />
        </section>

        {/* ── Top Movies for You ── */}
        <section className="py-4">
          <Top10Row heading="Top Movies for You" titles={top10Movies} loading={top10Loading} />
        </section>

        {/* ── New Releases ── */}
        <section className="py-4 ambient-glow-blue">
          <div className="mb-6 flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">NEW ARRIVALS - 2026</div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-foreground dark:text-white sm:text-3xl">New Releases</h2>
              </div>
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
            
            {/* Surface displaying multiple synchronized devices below the TV stand */}
            <div className="w-full mt-10 flex flex-wrap justify-center items-end gap-6 sm:gap-8 relative z-20">
              {/* Device 1: Tablet */}
              <div className="relative w-32 aspect-[4/3] rounded border border-zinc-700 bg-zinc-950 shadow-xl flex items-center justify-center p-0.5 overflow-hidden transition-all duration-300 hover:scale-105">
                <TvVideo src={tvVideoUrl} />
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-zinc-800" />
              </div>

              {/* Device 2: Folded Phone/Tablet */}
              <div className="relative w-24 aspect-[1/1] rounded-md border border-zinc-700 bg-zinc-950 shadow-xl flex items-center justify-center p-0.5 overflow-hidden transition-all duration-300 hover:scale-105">
                <TvVideo src={tvVideoUrl} />
              </div>

              {/* Device 3: Smartphone */}
              <div className="relative w-14 aspect-[9/19] rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl flex items-center justify-center p-0.5 overflow-hidden transition-all duration-300 hover:scale-105">
                <TvVideo src={tvVideoUrl} />
                <div className="absolute top-1 size-1 rounded-full bg-zinc-800" />
              </div>

              {/* Device 4: Laptop */}
              <div className="relative flex flex-col items-center transition-all duration-300 hover:scale-105">
                {/* Screen */}
                <div className="w-44 aspect-[16/10] bg-zinc-950 border border-zinc-700 rounded-t-lg overflow-hidden p-0.5 shadow-xl flex items-center justify-center">
                  <TvVideo src={tvVideoUrl} />
                </div>
                {/* Base */}
                <div className="w-48 h-2 bg-[#474852] border-t border-white/50 rounded-b shadow-lg relative">
                  <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-zinc-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 space-y-6">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">DEVICES & PLAYERS</div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground dark:text-white">
               Enjoy on the big screen
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg font-normal">
              Watch on Smart TVs, PlayStation 5, Xbox Series X/S, Chromecast, Apple TV, Blu-ray players, and more. Our high-fidelity player delivers native 4K HDR playback and Dolby Atmos spatial audio for the ultimate theater experience right in your living room.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <span className="text-xs font-medium text-foreground/50 uppercase tracking-widest">Supported Formats:</span>
              <span className="text-xs font-bold text-foreground/80 dark:text-white/80 px-2.5 py-1 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-lg">4K UHD</span>
              <span className="text-xs font-bold text-foreground/80 dark:text-white/80 px-2.5 py-1 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-lg">HDR10+</span>
              <span className="text-xs font-bold text-foreground/80 dark:text-white/80 px-2.5 py-1 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-lg">Dolby Atmos</span>
            </div>
          </div>
        </section>

        {/* ── Browse by Genre ── */}
        <section className="py-8 ambient-glow-blue">
          <div className="mb-12 text-center space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">CATEGORIES</div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground dark:text-white">Browse by Genre</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">Explore thousands of titles across every category, hand-picked for your mood.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-5">
            {/* Top 2 large wide cards */}
            {[
              genres.find((g) => g.name === "Horror") || genres[7],
              genres.find((g) => g.name === "TV Shows") || genres[3],
            ].map((g) => (
              <Link
                key={g.name}
                to="/library"
                className="col-span-2 md:col-span-3 relative overflow-hidden rounded-2xl aspect-[21/9] bg-card border border-border/30 dark:border-white/5 shadow-2xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)] hover:border-primary/40 group"
              >
                <img
                  src={`/public/images/categories/${g.src}`}
                  alt={g.name}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  style={{ filter: "brightness(0.65) contrast(1.15)" }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-all duration-500 group-hover:from-black/95 group-hover:via-black/50" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end">
                  <span className="text-xl md:text-2xl font-black text-white drop-shadow group-hover:text-primary transition-colors duration-300">{g.name}</span>
                  <span className="text-xs text-white/50 mt-1 font-semibold transition-all group-hover:text-white/70">{g.count.toLocaleString()} titles</span>
                </div>
              </Link>
            ))}

            {/* Bottom 6 small cards */}
            {genres
              .filter((g) => g.name !== "Horror" && g.name !== "TV Shows")
              .map((g) => (
                <Link
                  key={g.name}
                  to="/library"
                  className="col-span-1 relative overflow-hidden rounded-2xl aspect-[1.1/1] bg-card border border-border/30 dark:border-white/5 shadow-2xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)] hover:border-primary/40 group"
                >
                  <img
                    src={`/public/images/categories/${g.src}`}
                    alt={g.name}
                    className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    style={{ filter: "brightness(0.6) contrast(1.15)" }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-all duration-500 group-hover:from-black/95 group-hover:via-black/50" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end">
                    <span className="text-base font-extrabold text-white drop-shadow group-hover:text-primary transition-colors duration-300">{g.name}</span>
                    <span className="text-[10px] text-white/50 mt-0.5 font-semibold transition-all group-hover:text-white/70">{g.count.toLocaleString()} titles</span>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="rounded-3xl border border-border bg-card/40 dark:border-white/5 dark:bg-gradient-to-b dark:from-white/[0.03] to-white/[0.005] p-8 sm:p-14 backdrop-blur-md relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-indigo-900/10 blur-[120px]" />

          <div className="mx-auto max-w-2xl text-center space-y-4 relative z-10">
            <Badge className="bg-success/10 text-success border border-success/30 hover:bg-success/15 uppercase tracking-widest text-xs px-3.5 py-1">Flexible Plans</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground">Pick the plan that fits</h2>
            <p className="text-muted-foreground text-base">Switch or cancel anytime. All plans include our 7-day risk-free trial.</p>
          </div>
          
          <div className="mt-14 grid gap-8 md:grid-cols-3 relative z-10">
            {plansList.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-500 ${
                  p.highlight
                    ? "border-primary bg-gradient-to-b from-primary/15 to-primary/[0.01] hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(192,57,43,0.25)]"
                    : "border-border bg-card dark:border-white/5 dark:bg-gradient-to-b dark:from-white/5 dark:to-white/[0.01] hover:border-zinc-350 dark:hover:border-white/15 hover:-translate-y-1 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)]"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1.5 text-xs font-black text-white uppercase tracking-wider shadow-[0_0_24px_rgba(192,57,43,0.5)]">
                    Most Popular
                  </span>
                )}
                
                <h3 className="font-extrabold text-xl text-foreground">{p.name}</h3>
                
                <div className="mt-6 flex items-end gap-1">
                  <p className="text-5xl font-black tracking-tight text-foreground">₹{p.cadence === "Yearly" ? p.priceInr : p.perMonthInr}</p>
                  <span className="mb-1 text-sm font-medium text-muted-foreground">/{p.cadence === "Yearly" ? "yr" : "mo"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                  {p.cadence === "Yearly" ? `₹${p.perMonthInr}/mo equivalent` : `₹${p.priceInr} billed monthly`}
                </p>
                
                <div className="mt-6 rounded-xl bg-secondary border border-border dark:bg-white/5 dark:border-white/5 px-4 py-3.5 text-sm">
                  <span className="font-bold text-foreground">{p.quality}</span>
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
                  className={`mt-8 w-full font-bold text-sm py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    p.highlight 
                      ? "bg-primary hover:bg-primary/95 text-white shadow-[0_0_20px_rgba(192,57,43,0.3)]" 
                      : "bg-foreground/5 border border-border hover:bg-foreground/10 text-foreground dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15 dark:text-white"
                  }`}
                  variant={p.highlight ? "default" : "secondary"}
                  onClick={() => handleSelectPlan(p)}
                >
                  {isAuthenticated ? (
                    <><Zap className="mr-2 size-4" />Get {p.name}</>
                  ) : (
                    <><Lock className="mr-2 size-4" />Sign in to Subscribe</>
                  )}
                </Button>
              </div>
            ))}
          </div>
          
          <p className="mt-8 text-center text-xs text-muted-foreground relative z-10 font-medium">
            All plans include a 7-day free trial. Cancel before your trial ends and you won't be charged.
          </p>
        </section>

        {/* ── Confirmation Modal ── */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Gradient accent top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary to-orange-400" />

              <div className="p-6 sm:p-7">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="absolute top-5 right-5 flex size-7 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15">
                    <CreditCard className="size-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Confirm Subscription</h3>
                    <p className="text-xs text-muted-foreground">Review your order below</p>
                  </div>
                </div>

                {/* Order summary */}
                <div className="rounded-xl border border-border bg-secondary/35 dark:bg-white/5 divide-y divide-border dark:divide-white/10 overflow-hidden mb-5">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-semibold text-foreground">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Billing cycle</span>
                    <span className="inline-flex items-center gap-1 text-foreground">
                      {selectedPlan.cadence}
                      {selectedPlan.cadence === "Yearly" && (
                        <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                          Save 20%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Trial period</span>
                    <span className="text-success font-medium">7 days free</span>
                  </div>
                  <div className="flex items-center justify-between bg-secondary/60 dark:bg-white/10 px-4 py-3 font-bold text-foreground">
                    <span>Total today</span>
                    <span className="text-lg text-primary">₹{selectedPlan.priceInr}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center mb-5 leading-relaxed">
                  You'll complete payment on our secure checkout page.
                  Your card details go directly to Stripe — never stored on our servers.
                </p>

                <div className="flex flex-col gap-2.5">
                  <Button
                    className="h-11 w-full bg-gradient-to-r from-primary to-orange-500 font-semibold shadow-glow hover:from-primary/90 hover:to-orange-500/90 border-0 text-white cursor-pointer"
                    onClick={handleCheckout}
                  >
                    <Lock className="mr-2 size-4" />Continue to Payment
                  </Button>
                  <Button variant="ghost" className="h-9 text-sm text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setSelectedPlan(null)}>
                    Cancel
                  </Button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="size-3" /> SSL Encrypted</span>
                  <span className="size-1 rounded-full bg-foreground/10 dark:bg-white/10" />
                  <span className="flex items-center gap-1"><Lock className="size-3" /> PCI Compliant</span>
                  <span className="size-1 rounded-full bg-foreground/10 dark:bg-white/10" />
                  <span className="flex items-center gap-1"><CreditCard className="size-3" /> Stripe</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Testimonials ── */}
        <section className="py-8 ambient-glow-purple">
          <div className="mb-12 text-center space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">TESTIMONIALS</div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground dark:text-white">Loved by millions of viewers</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">Don't take our word for it — hear from our community of cinephiles.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="group relative flex flex-col rounded-2xl border border-border bg-card dark:border-white/5 dark:bg-gradient-to-b dark:from-white/5 dark:to-white/[0.01] p-8 transition-all duration-500 hover:border-primary/30 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.65)] backdrop-blur-sm"
              >
                {/* Subtle double quotation mark watermark */}
                <span className="absolute right-6 top-6 text-6xl font-serif text-foreground/[0.03] dark:text-white/[0.03] select-none pointer-events-none group-hover:text-primary/5 transition-colors duration-500">“</span>
                
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-warning text-warning transition-transform group-hover:scale-110" />
                  ))}
                </div>
                
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/80 italic font-normal">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                
                <div className="mt-6 flex items-center gap-3.5 pt-5 border-t border-border dark:border-white/5">
                  <img
                    src={`https://i.pravatar.cc/48?img=${t.avatarSeed}`}
                    alt={t.name}
                    className="size-11 rounded-full object-cover ring-2 ring-border dark:ring-white/10 group-hover:ring-primary/40 transition-all duration-500"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-extrabold text-foreground dark:text-white">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Watch Anywhere ── */}
        <section className="rounded-3xl border border-border bg-card/60 dark:border-white/5 dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-white/[0.005] p-8 sm:p-14 overflow-hidden relative backdrop-blur-md">
          {/* Subtle decorative glow */}
          <div className="pointer-events-none absolute -top-32 -right-32 size-80 rounded-full bg-primary/10 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-indigo-900/10 blur-[100px]" />
          
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center relative z-10">
            <div className="space-y-6">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">ANY TIME, ANY DEVICE</div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground dark:text-white">Stream on any screen, Anywhere</h2>
              <p className="text-muted-foreground leading-relaxed text-base font-normal">
                Seamless handoff across all your devices. Start a blockbuster film on your living room Smart TV, continue on your mobile device during your commute, and finish watching on your laptop — right where you left off.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { label: "UHD 4K", desc: "Breathtaking clarity on every screen" },
                  { label: "Dolby Atmos", desc: "Spatial 3D audio experience" },
                  { label: "Offline Mode", desc: "Download and watch anywhere" },
                  { label: "Cancel Anytime", desc: "Flexible monthly billing" }
                ].map((f) => (
                  <div
                    key={f.label}
                    className="group rounded-xl border border-border bg-foreground/5 dark:border-white/5 dark:bg-white/[0.02] px-4 py-4 transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.02]"
                  >
                    <div className="size-2 rounded-full bg-primary mb-2 transition-all duration-300 group-hover:scale-125" />
                    <p className="text-xs font-bold text-foreground dark:text-white">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 font-normal">{f.desc}</p>
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
        <section className="py-8 ambient-glow-blue">
          <div className="mb-12 text-center space-y-3">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">FAQ</div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground dark:text-white">Frequently asked questions</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">Everything you need to know before joining StreamVault.</p>
          </div>
          <div className="mx-auto max-w-3xl relative">
            {/* Floating Glass Orb Decoration */}
            <div className="absolute -right-24 top-1/2 -translate-y-1/2 size-20 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/25 to-pink-500/10 blur-[2px] border border-border dark:border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_12px_24px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_12px_24px_rgba(0,0,0,0.6)] pointer-events-none animate-float hidden lg:block z-20" />
            <Accordion type="single" collapsible className="space-y-4">
              {FAQ.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-2xl border border-border bg-card dark:border-white/5 dark:bg-white/[0.02] px-7 transition-all duration-300 data-[state=open]:border-primary/30 data-[state=open]:bg-secondary/40 dark:data-[state=open]:bg-white/[0.04] data-[state=open]:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)] dark:data-[state=open]:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]"
                >
                  <AccordionTrigger className="text-left font-bold text-base hover:no-underline py-5 text-foreground hover:text-primary dark:text-white dark:hover:text-primary transition-colors">
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
            <h2 className="text-4xl font-black tracking-tight sm:text-6xl text-foreground dark:text-white">
              Ready to start watching?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed font-normal">
              Join 2.4M+ subscribers enjoying pristine 4K HDR entertainment. Start your 7-day free trial today.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4 justify-center items-center">
              <Button size="lg" asChild className="relative group overflow-hidden bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-white/95 font-extrabold px-10 py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-2xl cursor-pointer border-0">
                <Link to="/signup">
                  {/* Subtle inner light reflection */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Play className="mr-2.5 size-5 fill-white dark:fill-black text-white dark:text-black" /> Start Free Trial
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="px-8 py-6 rounded-xl border border-border bg-foreground/5 text-foreground hover:bg-foreground/10 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                <Link to="/pricing">Compare Plans</Link>
              </Button>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-semibold text-muted-foreground">
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
