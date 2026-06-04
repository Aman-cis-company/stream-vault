import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Hls from "hls.js";
import { apiClient } from "@/services/api";
import { fetchVideoStreamUrl, mapMovieToTitle } from "@/lib/movies";
import type { Title } from "@/lib/mock-data";
import type { BackendMovie } from "@/store/slices/moviesSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Info,
  Star,
  Clock,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
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
      const hls = new Hls({ enableWorker: true, autoStartLoad: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) hls.recoverMediaError();
      });
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
      className={`group relative shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
        active
          ? "ring-2 ring-primary shadow-[0_0_20px_rgba(192,57,43,0.5)] scale-105"
          : "opacity-60 hover:opacity-90 hover:scale-[1.03]"
      }`}
      style={{ width: "clamp(90px, 12vw, 140px)", aspectRatio: "2/3" }}
    >
      <img
        src={title.posterUrl}
        alt={title.name}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            `https://picsum.photos/seed/${title.id}/140/210`;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-2">
        <p className="text-[10px] font-semibold text-white leading-tight line-clamp-2 drop-shadow">
          {title.name}
        </p>
      </div>
      {active && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
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

// Cache resolved URLs so we never call fetchVideoStreamUrl twice for the same movie
const resolvedUrlCache = new Map<string, string>();

export function Hero() {
  const [movies, setMovies] = useState<Title[]>(FALLBACK_MOVIES);
  const [activeIdx, setActiveIdx] = useState(0);
  const [videoBgMuted, setVideoBgMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>("");

  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  // Track which movie ID we last fetched a URL for — prevents duplicate calls
  const lastFetchedId = useRef<string>("");

  // Fetch real movies from backend
  useEffect(() => {
    apiClient
      .get("/movies?status=published&limit=8")
      .then(({ data }) => {
        const fetched: Title[] = (data.data.movies as BackendMovie[])
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
  }, []);

  const safeIdx = movies.length > 0 ? Math.min(activeIdx, movies.length - 1) : 0;
  const current = movies[safeIdx];

  // Resolve stream URL — only when the movie ID actually changes, with cache
  useEffect(() => {
    if (!current?.id || !current?.hlsUrl) {
      setResolvedVideoUrl("");
      return;
    }

    // Same movie — don't refetch
    if (lastFetchedId.current === current.id) return;
    lastFetchedId.current = current.id;

    // Already cached — use immediately, no request needed
    if (resolvedUrlCache.has(current.id)) {
      setResolvedVideoUrl(resolvedUrlCache.get(current.id)!);
      return;
    }

    // Clear stale URL while we fetch
    setResolvedVideoUrl("");

    let cancelled = false;

    if (current.hlsUrl.includes("/uploads/videos/")) {
      // Local video — fetch signed stream URL (same as WatchInner)
      fetchVideoStreamUrl(current.id)
        .then((url) => {
          if (!cancelled && url) {
            resolvedUrlCache.set(current.id, url); // cache it
            setResolvedVideoUrl(url);
          }
        })
        .catch(() => {});
    } else {
      // Bunny Stream / CDN / external HLS — use directly, no fetch needed
      resolvedUrlCache.set(current.id, current.hlsUrl);
      setResolvedVideoUrl(current.hlsUrl);
    }

    return () => {
      cancelled = true;
    };
  }, [current?.id]); // ← only current.id, NOT current.hlsUrl — prevents re-runs on re-renders

  // Auto-rotation ticker
  const startTicker = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    progressRef.current = 0;
    setProgress(0);

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

  // Nothing to show until the API responds
  if (!current) {
    return (
      <section
        className="relative -mt-16 w-full overflow-hidden bg-[#0a0a0f]"
        style={{ height: "clamp(520px, 78vh, 820px)" }}
      />
    );
  }

  return (
    <section
      className="relative -mt-16 w-full overflow-hidden"
      style={{ height: "clamp(520px, 78vh, 820px)" }}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Background poster */}
      <img
        key={`poster-${current.id}`}
        src={current.backdropUrl || current.posterUrl}
        alt={current.name}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ zIndex: 0 }}
      />

      {/* Video overlay — only when URL is resolved */}
      {hasVideo && (
        <BgVideo
          key={`video-${current.id}`}
          src={effectiveVideoUrl}
          poster={current.backdropUrl}
          muted={videoBgMuted}
        />
      )}

      {/* Gradients */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-between px-4 pb-6 pt-24 sm:px-6">
        <div className="flex flex-1 flex-col justify-center max-w-xl mt-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
              ✦ Featured
            </span>
            {current.newRelease && (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                NEW
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1
            key={`title-${current.id}`}
            className="text-4xl font-extrabold leading-none tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-lg"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}
          >
            {current.name}
          </h1>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {current.rating > 0 && (
              <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                <Star className="size-3.5 fill-current" /> {current.rating}
              </span>
            )}
            <span className="text-white/50">{current.year}</span>
            {current.durationMin > 0 && (
              <span className="inline-flex items-center gap-1 text-white/50">
                <Clock className="size-3 shrink-0" /> {current.durationMin}m
              </span>
            )}
            <Badge
              variant="secondary"
              className="bg-white/10 text-white/70 border-white/10 font-normal text-[10px]"
            >
              {current.maturity}
            </Badge>
            {current.genres.length > 0 && (
              <span className="text-white/40 text-xs">
                {current.genres.join(" · ")}
              </span>
            )}
          </div>

          {/* Synopsis */}
          {current.synopsis && (
            <p
              key={`synopsis-${current.id}`}
              className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 line-clamp-3 sm:text-base"
            >
              {current.synopsis}
            </p>
          )}

          {/* Cast */}
          {current.cast.length > 0 && (
            <p className="mt-2 text-xs text-white/40">
              <span className="text-white/50 font-medium">Starring: </span>
              {current.cast.slice(0, 3).join(", ")}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(192,57,43,0.45)] font-semibold gap-2 px-7"
              asChild
            >
              <Link to={`/watch/${current.id}`}>
                <Play className="size-5 fill-current" /> Play Now
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-sm gap-2 px-7"
              asChild
            >
              <Link to={`/watch/${current.id}`}>
                <Info className="size-5" /> More Info
              </Link>
            </Button>

            {/* Sound toggle — only when video is playing */}
            {hasVideo && (
              <button
                onClick={() => setVideoBgMuted((v) => !v)}
                className="flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm text-white hover:bg-white/10 transition-colors"
                aria-label={videoBgMuted ? "Unmute" : "Mute"}
              >
                {videoBgMuted ? (
                  <VolumeX className="size-4 text-white/70" />
                ) : (
                  <Volume2 className="size-4 text-white" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bottom: movie selector */}
        {movies.length > 1 && (
          <div className="flex items-end gap-3">
            <button
              onClick={goPrev}
              className="hidden sm:flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur-sm text-white hover:bg-white/10 transition-colors mb-1"
              aria-label="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>

            <button
              onClick={goNext}
              className="hidden sm:flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur-sm text-white hover:bg-white/10 transition-colors mb-1"
              aria-label="Next"
            >
              <ChevronRight className="size-4" />
            </button>

            {/* Dot indicators (mobile) */}
            <div className="flex sm:hidden items-center gap-1 pb-1 ml-auto">
              {movies.slice(0, 4).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`rounded-full transition-all ${
                    idx === activeIdx
                      ? "w-5 h-1.5 bg-primary"
                      : "size-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}