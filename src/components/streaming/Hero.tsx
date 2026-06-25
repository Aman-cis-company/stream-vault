import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Hls from "hls.js";
import { apiClient } from "@/services/api";
import { fetchVideoStreamUrl, mapMovieToTitle } from "@/lib/movies";
import type { Title } from "@/lib/mock-data";
import type { BackendMovie } from "@/store/slices/moviesSlice";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingBadge } from "./RatingBadge";
import {
  Play,
  Info,
  Star,
  Clock,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Hd,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function videoType(url: string): "hls" | "direct" | "youtube" | "none" {
  if (!url) return "none";
  if (extractYouTubeId(url)) return "youtube";
  if (url.includes(".m3u8") || url.includes("/hls/")) return "hls";
  if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) return "direct";
  return "none";
}

// ── Background Video ──────────────────────────────────────────────────────────

interface BgVideoProps {
  src: string;
  poster: string;
  muted: boolean;
}

function BgVideo({ src, poster, muted }: BgVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const type = videoType(src);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (type === "hls" && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        autoStartLoad: true,
        capLevelToPlayerSize: false, // never cap to player size
        startLevel: -1, // overridden immediately in MANIFEST_PARSED
        maxBufferLength: 60, // buffer up to 60s ahead
        maxBufferSize: 120 * 1024 * 1024, // 120 MB buffer for HD
        maxMaxBufferLength: 120,
        // Assume 8 Mbps bandwidth so ABR picks highest tier immediately
        abrEwmaDefaultEstimate: 8_000_000,
        testBandwidth: false, // skip initial bandwidth test
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hls.levels && hls.levels.length > 0) {
          const top = hls.levels.length - 1;
          hls.currentLevel = top; // lock current segment fetch
          hls.loadLevel = top; // lock loader
          hls.nextLevel = top; // lock next switch
        }
        video.play().catch(() => {});
      });

      // Prevent any automatic quality downgrade after startup
      hls.on(Hls.Events.LEVEL_SWITCHING, (_, data) => {
        if (hls.levels && data.level < hls.levels.length - 1) {
          hls.nextLevel = hls.levels.length - 1;
        }
      });

      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) hls.recoverMediaError();
      });
    } else if (
      type === "hls" &&
      video.canPlayType("application/vnd.apple.mpegurl")
    ) {
      // Native HLS (Safari) — browser manages quality; just play
      video.src = src;
      video.load();
      video.play().catch(() => {});
    } else if (type === "direct") {
      video.src = src;
      video.load();
      video.play().catch(() => {});
    } else {
      video.src = "";
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, type]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  if (type === "none" || type === "youtube") return null;

  return (
    <video
      ref={videoRef}
      muted={muted}
      loop
      playsInline
      autoPlay
      poster={poster}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ zIndex: 0 }}
    />
  );
}

// ── Thumbnail Card ────────────────────────────────────────────────────────────

interface ThumbCardProps {
  title: Title;
  active: boolean;
  progress: number;
  onClick: () => void;
}

function ThumbCard({ title, active, progress, onClick }: ThumbCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative shrink-0 overflow-hidden rounded-lg transition-all duration-300 ${
        active
          ? "ring-2 ring-primary shadow-[0_0_18px_rgba(192,57,43,0.55)] scale-[1.07] opacity-100"
          : "opacity-55 hover:opacity-85 hover:scale-[1.04]"
      }`}
      style={{ width: "clamp(72px, 9vw, 110px)", aspectRatio: "2/3" }}
    >
      <img
        src={title.posterUrl}
        alt={title.name}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            `https://picsum.photos/seed/${title.id}/110/165`;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-1.5">
        <p className="text-[9px] font-semibold text-white leading-tight line-clamp-2 drop-shadow">
          {title.name}
        </p>
      </div>
      {active && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
          <div
            className="h-full bg-primary transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </button>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

const ROTATE_MS = 7000;
const FALLBACK_MOVIES: Title[] = [];

const resolvedUrlCache = new Map<string, string>();

export function Hero() {
  const [movies, setMovies] = useState<Title[]>(FALLBACK_MOVIES);
  const [activeIdx, setActiveIdx] = useState(0);
  const [videoBgMuted, setVideoBgMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>("");
  const [contentKey, setContentKey] = useState(0);

  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const lastFetchedId = useRef<string>("");

  const fetchBannerMovies = useCallback(() => {
    apiClient
      .get("/movies?status=published&is_banner=true&limit=10")
      .then(({ data }) => {
        let fetched: Title[] = (data.data.movies as BackendMovie[])
          .map(mapMovieToTitle)
          .filter((t) => t.backdropUrl || t.posterUrl);

        if (fetched.length >= 1) {
          setMovies(fetched);
          return;
        }

        // Fallback: fetch default published movies if no banner movies are set
        apiClient
          .get("/movies?status=published&limit=8")
          .then(({ data: fallbackData }) => {
            fetched = (fallbackData.data.movies as BackendMovie[])
              .map(mapMovieToTitle)
              .filter((t) => t.backdropUrl || t.posterUrl);
            if (fetched.length >= 2) setMovies(fetched.slice(0, 6));
            if (fetched.length > 0) {
              const targetIndex = fetched
                .slice(0, 6)
                .findIndex((movie) => movie.id === "10");
              if (targetIndex !== -1) {
                setActiveIdx(targetIndex);
              }
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBannerMovies();
  }, [fetchBannerMovies]);

  useSocketEvent(SOCKET_EVENTS.MOVIE_CREATED, fetchBannerMovies);
  useSocketEvent(SOCKET_EVENTS.MOVIE_UPDATED, fetchBannerMovies);
  useSocketEvent(SOCKET_EVENTS.MOVIE_DELETED, fetchBannerMovies);

  const safeIdx =
    movies.length > 0 ? Math.min(activeIdx, movies.length - 1) : 0;
  const current = movies[safeIdx];

  useEffect(() => {
    if (!current?.id || !current?.hlsUrl) {
      setResolvedVideoUrl("");
      return;
    }

    if (lastFetchedId.current === current.id) return;
    lastFetchedId.current = current.id;

    if (resolvedUrlCache.has(current.id)) {
      setResolvedVideoUrl(resolvedUrlCache.get(current.id)!);
      return;
    }

    setResolvedVideoUrl("");

    let cancelled = false;

    if (current.hlsUrl.includes("/uploads/videos/") || current.hlsUrl.includes("/uploads/hls/")) {
      fetchVideoStreamUrl(current.id)
        .then((url) => {
          if (!cancelled && url) {
            resolvedUrlCache.set(current.id, url);
            setResolvedVideoUrl(url);
          }
        })
        .catch(() => {});
    } else {
      resolvedUrlCache.set(current.id, current.hlsUrl);
      setResolvedVideoUrl(current.hlsUrl);
    }

    return () => {
      cancelled = true;
    };
  }, [current?.id]);

  const startTicker = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    progressRef.current = 0;
    setProgress(0);
    setContentKey((k) => k + 1);

    const tick = (ts: number) => {
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const pct = Math.min((elapsed / ROTATE_MS) * 100, 100);
      progressRef.current = pct;
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setActiveIdx((prev) => (prev + 1) % movies.length);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [movies.length]);

  useEffect(() => {
    startTicker();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeIdx, startTicker]);

  const goTo = (idx: number) => {
    if (idx === activeIdx) return;
    setActiveIdx(idx);
  };

  const goPrev = () => goTo((activeIdx - 1 + movies.length) % movies.length);
  const goNext = () => goTo((activeIdx + 1) % movies.length);

  const effectiveVideoUrl = resolvedVideoUrl;
  const hasVideo =
    !!effectiveVideoUrl &&
    videoType(effectiveVideoUrl) !== "none" &&
    videoType(effectiveVideoUrl) !== "youtube";

  if (!current) {
    return (
      <section
        className="relative -mt-16 w-full overflow-hidden bg-[#080810]"
        style={{ height: "clamp(560px, 82vh, 900px)" }}
      />
    );
  }

  return (
    <section
      className="relative -mt-16 w-full overflow-hidden"
      style={{ height: "clamp(560px, 82vh, 900px)" }}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      {/* Background poster with smooth crossfade */}
      <img
        key={`poster-${current.id}`}
        src={current.backdropUrl || current.posterUrl}
        alt={current.name}
        className="absolute inset-0 w-full h-full object-cover animate-fade-in"
        style={{ zIndex: 0 }}
      />

      {/* HD Video overlay */}
      {hasVideo && (
        <BgVideo
          key={`video-${current.id}`}
          src={effectiveVideoUrl}
          poster={current.backdropUrl}
          muted={videoBgMuted}
        />
      )}

      {/* Cinematic gradient layers */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.60) 45%, rgba(0,0,0,0.10) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.40) 35%, transparent 65%)",
        }}
      />
      {/* Subtle top fade for navbar blend */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
        }}
      />

      {/* HD / Video quality badge */}
      {hasVideo && (
        <div className="absolute top-20 right-6 z-30 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 backdrop-blur-sm">
          <Hd className="size-3.5 text-white/80" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            Live
          </span>
          <span className="size-1.5 rounded-full bg-primary animate-glow-pulse" />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-20 flex h-full max-w-full flex-col justify-between px-8 pb-6 pt-24 sm:px-8">
        {/* Hero text + actions */}
        <div
          key={`content-${contentKey}`}
          className="flex flex-1 flex-col justify-center max-w-2xl mt-4 animate-hero-in"
        >
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/20 px-3 py-1 text-xs font-bold text-primary backdrop-blur-sm shadow-[0_0_12px_rgba(192,57,43,0.3)]">
              ✦ Featured
            </span>
            {current.newRelease && (
              <Badge className="bg-amber-500/25 text-amber-300 border-amber-500/40 text-[10px] font-bold uppercase tracking-wide">
                New Release
              </Badge>
            )}
            {current.trending && (
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px] font-bold uppercase tracking-wide">
                Trending
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1
            className="text-4xl font-extrabold leading-none tracking-tight text-white sm:text-5xl lg:text-[3.75rem] drop-shadow-2xl"
            style={{ textShadow: "0 2px 30px rgba(0,0,0,0.75)" }}
          >
            {current.name}
          </h1>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {current.rating > 0 && <RatingBadge rating={current.rating} />}
            <span className="text-white/55 font-medium">{current.year}</span>
            {current.durationMin > 0 && (
              <span className="inline-flex items-center gap-1 text-white/55">
                <Clock className="size-3 shrink-0" /> {current.durationMin}m
              </span>
            )}
            <Badge
              variant="secondary"
              className="bg-white/10 text-white/70 border-white/15 font-normal text-[10px] backdrop-blur-sm"
            >
              {current.maturity}
            </Badge>
            {current.genres.length > 0 && (
              <span className="text-white/45 text-xs">
                {current.genres.join(" · ")}
              </span>
            )}
          </div>

          {/* Synopsis */}
          {current.synopsis && (
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 line-clamp-3 sm:text-base">
              {current.synopsis}
            </p>
          )}

          {/* Cast */}
          {current.cast.length > 0 && (
            <p className="mt-2 text-xs text-white/40">
              <span className="text-white/55 font-medium">Starring: </span>
              {current.cast.slice(0, 3).join(", ")}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 font-bold gap-2 px-7 shadow-xl text-base"
              asChild
            >
              <Link to={`/watch/${current.id}`}>
                <Play className="size-5 fill-black" /> Play
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md gap-2 px-7 font-semibold text-base"
              asChild
            >
              <Link to={`/watch/${current.id}`}>
                <Info className="size-5" /> More Info
              </Link>
            </Button>

            {/* Sound toggle */}
            {hasVideo && (
              <button
                onClick={() => setVideoBgMuted((v) => !v)}
                className="flex size-11 items-center justify-center rounded-full border border-white/25 bg-black/35 backdrop-blur-sm text-white hover:bg-white/15 transition-colors ml-1"
                aria-label={videoBgMuted ? "Unmute" : "Mute"}
              >
                {videoBgMuted ? (
                  <VolumeX className="size-4 text-white/65" />
                ) : (
                  <Volume2 className="size-4 text-white" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bottom bar — thumbnails + nav controls */}
        {movies.length > 1 && (
          <div className="flex items-end justify-start gap-4">
            {/* Thumbnail strip */}
            <div className="hidden sm:flex items-end gap-2 overflow-x-auto scrollbar-none pb-1">
              {movies.map((m, idx) => (
                <ThumbCard
                  key={m.id}
                  title={m}
                  active={idx === activeIdx}
                  progress={idx === activeIdx ? progress : 0}
                  onClick={() => goTo(idx)}
                />
              ))}
            </div>

            {/* Mobile dot indicators */}
            <div className="flex sm:hidden items-center gap-1.5 pb-1">
              {movies.slice(0, 6).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === activeIdx
                      ? "w-6 h-2 bg-primary shadow-[0_0_8px_rgba(192,57,43,0.7)]"
                      : "size-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>

            {/* Nav arrows */}
            <div className="flex items-center gap-2 shrink-0 pb-1">
              <button
                onClick={goPrev}
                className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/35 backdrop-blur-sm text-white hover:bg-white/15 transition-all hover:scale-105"
                aria-label="Previous"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={goNext}
                className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/35 backdrop-blur-sm text-white hover:bg-white/15 transition-all hover:scale-105"
                aria-label="Next"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom progress bar */}
      <div className="absolute inset-x-0 bottom-0 z-30 h-[2px] bg-white/8">
        <div
          className="h-full bg-primary transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  );
}
