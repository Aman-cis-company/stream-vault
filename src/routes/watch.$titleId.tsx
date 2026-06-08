import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import Hls from "hls.js";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Protected } from "@/components/streaming/Protected";
import { TitleCard } from "@/components/streaming/TitleCard";
import { AgeRatingBadge } from "@/components/streaming/AgeRatingBadge";
import { ContentWarningModal } from "@/components/streaming/ContentWarningModal";
import type { Title } from "@/lib/mock-data";
import { fetchMovieById, fetchMovies, fetchVideoStreamUrl, getMovieProgress, saveMovieProgress, fetchInteractionStatus, toggleLike, toggleList } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Plus,
  Check,
  ThumbsUp,
  Share2,
  Star,
  ArrowLeft,
  Settings,
  Subtitles,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isHlsUrl(url: string): boolean {
  return url.includes(".m3u8") || url.includes("/hls/");
}

function videoSourceType(url: string): "youtube" | "hls" | "direct" | "none" {
  if (!url) return "none";
  if (extractYouTubeId(url)) return "youtube";
  if (isHlsUrl(url)) return "hls";
  return "direct";
}

// ── YouTube Player ───────────────────────────────────────────────────────────

function YouTubePlayer({ videoId, title, resumeFrom = 0 }: { videoId: string; title: string; resumeFrom?: number }) {
  const startParam = resumeFrom > 5 ? `&start=${Math.floor(resumeFrom)}` : "";
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1${startParam}`;
  return (
    <div className="relative w-full aspect-video bg-black">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        style={{ border: 0 }}
      />
      {/* DRM badge overlay */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 z-10">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 backdrop-blur-sm border border-emerald-500/30">
          <svg className="size-2.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a5 5 0 0 1 5 5v1h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 1 5-5zm0 1.5A3.5 3.5 0 0 0 4.5 6v1h7V6A3.5 3.5 0 0 0 8 2.5z" />
          </svg>
          DRM Protected
        </span>
      </div>
    </div>
  );
}

// ── Native HLS / Direct Player ───────────────────────────────────────────────

interface NativePlayerProps {
  src: string;
  poster: string;
  title: string;
  durationMin: number;
  resumeFrom?: number;
  onProgress?: (currentTime: number, duration: number) => void;
  onResumeConfirmed?: () => void;
}

function NativePlayer({ src, poster, title, durationMin, resumeFrom = 0, onProgress, onResumeConfirmed }: NativePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasSeekRef = useRef(false);
  const resumeFromRef = useRef(resumeFrom);
  resumeFromRef.current = resumeFrom;

  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationMin * 60);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [qualities, setQualities] = useState<string[]>(["Auto"]);
  const [activeQuality, setActiveQuality] = useState("Auto");
  const [buffering, setBuffering] = useState(true);
  const [hoverTime, setHoverTime] = useState<{ pct: number; label: string } | null>(null);

  // HLS setup + autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setBuffering(true);
    setQualities(["Auto"]);
    setActiveQuality("Auto");

    const tryPlay = () => {
      video.play().catch(() => {
        // Browser blocked unmuted autoplay → fallback to muted
        video.muted = true;
        setMuted(true);
        video.play().catch(() => {});
      });
    };

    if (isHlsUrl(src) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setBuffering(false);
        const lvls = data.levels.map((l) => (l.height ? `${l.height}p` : "Auto"));
        setQualities(["Auto", ...new Set(lvls)]);
        if (resumeFromRef.current > 5 && !hasSeekRef.current) {
          video.currentTime = resumeFromRef.current;
          hasSeekRef.current = true;
          setShowResumeBanner(true);
        }
        tryPlay();
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) {
          if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else {
            hls.recoverMediaError();
          }
        }
      });
      return () => { hls.destroy(); hlsRef.current = null; };
    } else {
      video.src = src;
      video.load();
      video.addEventListener("loadeddata", () => {
        setBuffering(false);
        if (resumeFromRef.current > 5 && !hasSeekRef.current) {
          video.currentTime = resumeFromRef.current;
          hasSeekRef.current = true;
          setShowResumeBanner(true);
        }
        tryPlay();
      }, { once: true });
    }
  }, [src]);

  // Video event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const on = (e: string, h: () => void) => v.addEventListener(e, h);
    const off = (e: string, h: () => void) => v.removeEventListener(e, h);

    const onTime = () => {
      setCurrentTime(v.currentTime);
      if (isFinite(v.duration)) onProgress?.(v.currentTime, v.duration);
    };
    const onDur = () => { if (isFinite(v.duration)) setDuration(v.duration); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWait = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onProg = () => {
      if (v.buffered.length && v.duration)
        setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    };
    const onVol = () => { setVolume(v.volume); setMuted(v.muted); };
    const onFs = () => setFullscreen(!!document.fullscreenElement);

    on("timeupdate", onTime); on("durationchange", onDur); on("play", onPlay);
    on("pause", onPause); on("waiting", onWait); on("playing", onPlaying);
    on("progress", onProg); on("volumechange", onVol);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      off("timeupdate", onTime); off("durationchange", onDur); off("play", onPlay);
      off("pause", onPause); off("waiting", onWait); off("playing", onPlaying);
      off("progress", onProg); off("volumechange", onVol);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  const resetHide = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    v.paused ? v.play() : v.pause();
    resetHide();
  };

  const seek = (pct: number) => {
    const v = videoRef.current; if (!v || !isFinite(v.duration)) return;
    v.currentTime = (pct / 100) * v.duration; resetHide();
  };

  const skip = (s: number) => {
    const v = videoRef.current; if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + s)); resetHide();
  };

  const setVol = (val: number) => {
    const v = videoRef.current; if (!v) return;
    v.volume = val; v.muted = val === 0;
  };

  const toggleMute = () => {
    const v = videoRef.current; if (!v) return; v.muted = !v.muted;
  };

  const toggleFullscreen = () => {
    document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen();
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    setHoverTime({ pct, label: fmtTime((pct / 100) * duration) });
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none overflow-hidden"
      style={{ maxHeight: "62vh", aspectRatio: "16/7" }}
      onMouseMove={resetHide}
      onMouseLeave={() => { if (playing) setShowControls(false); setHoverTime(null); }}
      onDoubleClick={toggleFullscreen}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        onClick={togglePlay}
        style={{ cursor: "pointer", display: "block" }}
      />

      {/* Vignette — bottom heavy */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.25) 100%)",
        }}
      />

      {/* Buffering spinner */}
      {buffering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
          <div className="relative size-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-white animate-spin" />
          </div>
        </div>
      )}

      {/* Muted autoplay notice */}
      {muted && playing && (
        <button
          onClick={() => { const v = videoRef.current; if (v) { v.muted = false; setMuted(false); } }}
          className="absolute top-3 right-3 z-30 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white border border-white/20 hover:bg-black/90 transition-colors"
        >
          <VolumeX className="size-3.5 text-amber-400" />
          <span className="text-amber-300">Tap to unmute</span>
        </button>
      )}

      {/* Resume banner */}
      {showResumeBanner && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-lg bg-black/85 backdrop-blur-sm px-4 py-2.5 text-sm text-white border border-white/15 shadow-2xl whitespace-nowrap">
          <span className="text-white/70">Resumed from <span className="text-white font-semibold">{fmtTime(resumeFromRef.current)}</span></span>
          <button
            onClick={() => {
              const v = videoRef.current;
              if (v) v.currentTime = 0;
              hasSeekRef.current = false;
              setShowResumeBanner(false);
              onResumeConfirmed?.();
            }}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Start over
          </button>
          <button
            onClick={() => setShowResumeBanner(false)}
            className="text-white/40 hover:text-white/70 text-base leading-none transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Top badges (fade with controls) */}
      <div
        className={`pointer-events-none absolute left-3 top-3 flex items-center gap-2 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
          <svg className="size-2.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a5 5 0 0 1 5 5v1h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 1 5-5zm0 1.5A3.5 3.5 0 0 0 4.5 6v1h7V6A3.5 3.5 0 0 0 8 2.5z"/>
          </svg>
          DRM
        </span>
        <span className="inline-flex items-center rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/25 tracking-wide">
          HD
        </span>
      </div>

      {/* Centre click-to-play ripple */}
      {!playing && !buffering && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          key="center-play"
        >
          <div className="size-16 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30 shadow-2xl animate-pulse">
            <Play className="size-7 fill-white text-white ml-0.5" />
          </div>
        </div>
      )}

      {/* ── Controls overlay ── */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 transition-all duration-300 ${showControls || !playing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"}`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="group/seek relative mx-3 mb-2 h-[3px] cursor-pointer rounded-full bg-white/20 hover:h-[5px] transition-all duration-100"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * 100);
          }}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Buffered track */}
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/20 transition-all" style={{ width: `${buffered}%` }} />
          {/* Played track */}
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-100" style={{ width: `${progress}%` }}>
            {/* Scrubber dot */}
            <div className="absolute right-0 top-1/2 size-3.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)] opacity-0 group-hover/seek:opacity-100 transition-opacity" />
          </div>
          {/* Time tooltip */}
          {hoverTime && (
            <div
              className="pointer-events-none absolute -top-7 rounded-md bg-black/90 backdrop-blur-sm px-1.5 py-0.5 text-[11px] font-medium text-white border border-white/10 shadow-lg"
              style={{ left: `clamp(0%, ${hoverTime.pct}%, calc(100% - 40px))`, transform: "translateX(-50%)" }}
            >
              {hoverTime.label}
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-0.5 px-3 pb-3 pt-1">
          {/* ── Left group ── */}
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="group flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing
              ? <Pause className="size-[18px] fill-white text-white" />
              : <Play className="size-[18px] fill-white text-white ml-0.5" />
            }
          </button>

          {/* Skip -10 */}
          <button
            onClick={() => skip(-10)}
            className="hidden sm:flex relative items-center justify-center size-9 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Rewind 10s"
          >
            <SkipBack className="size-[15px] text-white/80" />
            <span className="absolute text-[8px] font-bold text-white/70 mt-1 leading-none" style={{ bottom: "9px" }}>10</span>
          </button>

          {/* Skip +10 */}
          <button
            onClick={() => skip(10)}
            className="hidden sm:flex relative items-center justify-center size-9 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Forward 10s"
          >
            <SkipForward className="size-[15px] text-white/80" />
            <span className="absolute text-[8px] font-bold text-white/70 mt-1 leading-none" style={{ bottom: "9px" }}>10</span>
          </button>

          {/* Volume */}
          <div className="group/vol flex items-center gap-1 ml-0.5">
            <button
              onClick={toggleMute}
              className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
            >
              {muted || volume === 0
                ? <VolumeX className="size-[15px] text-white/80" />
                : <Volume2 className="size-[15px] text-white/80" />
              }
            </button>
            <div className="hidden sm:block overflow-hidden w-0 group-hover/vol:w-20 transition-all duration-200">
              <input
                type="range" min={0} max={1} step={0.02}
                value={muted ? 0 : volume}
                onChange={(e) => setVol(Number(e.target.value))}
                className="w-20 h-1 accent-white cursor-pointer"
                style={{ accentColor: "white" }}
              />
            </div>
          </div>

          {/* Time */}
          <span className="ml-1 hidden md:block text-[11px] tabular-nums text-white/60 font-medium whitespace-nowrap">
            {fmtTime(currentTime)}
            <span className="text-white/30 mx-1">/</span>
            {fmtTime(duration)}
          </span>

          {/* ── Spacer ── */}
          <div className="flex-1" />

          {/* Title (center-ish) */}
          <span className="hidden lg:block text-[11px] text-white/50 font-medium truncate max-w-[200px] mx-2">{title}</span>

          <div className="flex-1" />

          {/* ── Right group ── */}
          {/* Subtitles */}
          <button
            className="hidden sm:flex size-9 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
            onClick={() => toast.info("Subtitles not available")}
            aria-label="Subtitles"
          >
            <Subtitles className="size-[15px] text-white/70" />
          </button>

          {/* Quality */}
          {qualities.length > 1 && (
            <div className="relative">
              <button
                onClick={() => { setShowSettings((v) => !v); resetHide(); }}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-white/10 active:scale-95 transition-all"
              >
                <Settings className="size-[14px] text-white/70" />
                <span className="hidden sm:block text-[10px] font-semibold text-white/60">{activeQuality}</span>
              </button>
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 w-32 rounded-xl border border-white/10 bg-[#111]/95 backdrop-blur-xl overflow-hidden shadow-2xl z-50">
                  <p className="px-3 py-2 text-[9px] font-semibold uppercase tracking-widest text-white/30 border-b border-white/5">Quality</p>
                  {qualities.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setActiveQuality(q); setShowSettings(false);
                        if (hlsRef.current) {
                          if (q !== "Auto") {
                            const lvl = hlsRef.current.levels.findIndex((l) => `${l.height}p` === q);
                            if (lvl >= 0) hlsRef.current.currentLevel = lvl;
                          } else hlsRef.current.currentLevel = -1;
                        }
                      }}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors ${
                        activeQuality === q ? "text-primary bg-primary/10 font-semibold" : "text-white/75 hover:bg-white/8"
                      }`}
                    >
                      {q}
                      {activeQuality === q && <Check className="size-3 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen
              ? <Minimize className="size-[15px] text-white/80" />
              : <Maximize className="size-[15px] text-white/80" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Watch Page ──────────────────────────────────────────────────────────

export default function WatchPage() {
  return (
    <Protected>
      <WatchInner />
    </Protected>
  );
}

function WatchInner() {
  const { titleId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const [title, setTitle] = useState<Title | null | undefined>(undefined);
  const [related, setRelated] = useState<Title[]>([]);
  const [inList, setInList] = useState(false);
  const [liked, setLiked] = useState(false);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [resumeFrom, setResumeFrom] = useState(0);
  const [savedAt, setSavedAt] = useState(0);
  const lastSavedRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMovie = useCallback((id: string, isPolling = false) => {
    fetchMovieById(id)
      .then((t) => {
        setTitle(t);
        if (!t) return;

        if (!isPolling) {
          fetchMovies()
            .then((all) => setRelated(all.filter((m) => m.id !== t.id).slice(0, 8)))
            .catch(() => {});
          fetchInteractionStatus('movie', id)
            .then((s) => { setInList(s.in_list); setLiked(s.is_liked); })
            .catch(() => {});
          if ((t.is_age_restricted || (t.warning_flags_json && t.warning_flags_json.length > 0)) && user?.age_verified) {
            setShowWarning(true);
          }
          getMovieProgress(id)
            .then((p) => {
              if (p && p.watch_time > 5 && p.completion_percentage < 95) {
                setResumeFrom(p.watch_time);
              }
            })
            .catch(() => {});
        }

        if (t.hlsUrl && t.hlsUrl.includes("/uploads/videos/")) {
          fetchVideoStreamUrl(id)
            .then((url) => { if (url) setResolvedVideoUrl(url); })
            .catch(() => {});
        } else {
          setResolvedVideoUrl(null);
        }

        // Poll every 10 s while transcoding is in progress
        if (t.transcoding_status === "pending" || t.transcoding_status === "processing") {
          pollTimerRef.current = setTimeout(() => loadMovie(id, true), 10000);
        }
      })
      .catch(() => { if (!isPolling) setTitle(null); });
  }, [user?.age_verified]);

  useEffect(() => {
    if (!titleId) return;
    // Cancel any in-flight poll from a previous movie
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
    // Reset all stale state before loading the new movie
    setTitle(undefined);
    setResolvedVideoUrl(null);
    setWarningAcknowledged(false);
    setShowWarning(false);
    setResumeFrom(0);
    setInList(false);
    setLiked(false);
    lastSavedRef.current = 0;
    setSavedAt(0);
    loadMovie(titleId);
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, [titleId, loadMovie]);

  const handleProgress = useCallback((currentTime: number, dur: number) => {
    if (currentTime < 5) return;
    if (currentTime - lastSavedRef.current >= 10) {
      lastSavedRef.current = currentTime;
      setSavedAt(currentTime);
      saveMovieProgress(titleId!, currentTime, dur);
    }
  }, [titleId]);

  if (title === undefined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="size-10 animate-spin text-white/40" />
      </div>
    );
  }

  if (!title) {
    return (
      <MainLayout>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-bold">Title not found</h1>
          <Button className="mt-4" asChild>
            <Link to="/browse">Back to browse</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Use the signed stream URL for local files, fall back to the stored URL for CDN/YouTube
  const effectiveVideoUrl = resolvedVideoUrl ?? title.hlsUrl;
  const srcType = videoSourceType(effectiveVideoUrl);
  const youtubeId = srcType === "youtube" ? extractYouTubeId(effectiveVideoUrl) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Content warning modal for age-restricted content */}
      {title && showWarning && !warningAcknowledged && (
        <ContentWarningModal
          open
          title={title.name}
          contentRating={title.content_rating}
          warningFlags={title.warning_flags_json}
          minimumAge={title.minimum_age}
          onConfirm={() => { setShowWarning(false); setWarningAcknowledged(true); }}
          onCancel={() => navigate(-1)}
        />
      )}

      {/* Top nav bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <span className="text-white/30">·</span>
        <span className="text-white/70 text-sm truncate">{title.name}</span>
      </div>

      {/* ── Video Player ── */}
      <div className="w-full bg-black shadow-2xl">
        {(title.transcoding_status === "pending" || title.transcoding_status === "processing") ? (
          <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center gap-4">
            <img
              src={title.backdropUrl}
              alt={title.name}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="relative z-10 text-center px-4">
              <div className="size-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="size-9 text-primary animate-spin" />
              </div>
              <p className="text-white font-semibold text-base mb-1">Transcoding in progress</p>
              <p className="text-white/50 text-sm">Creating 360p / 720p / 1080p versions&hellip;</p>
              <p className="text-white/30 text-xs mt-3">This page will update automatically when ready.</p>
            </div>
          </div>
        ) : srcType === "none" ? (
          <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center gap-4">
            <img
              src={title.backdropUrl}
              alt={title.name}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="relative z-10 text-center">
              <div className="size-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Play className="size-8 text-white/30 ml-1" />
              </div>
              <p className="text-white/50 text-sm">No video source available</p>
            </div>
          </div>
        ) : srcType === "youtube" && youtubeId ? (
          <YouTubePlayer videoId={youtubeId} title={title.name} resumeFrom={resumeFrom} />
        ) : (
          <NativePlayer
            src={effectiveVideoUrl}
            poster={title.backdropUrl}
            title={title.name}
            durationMin={title.durationMin}
            resumeFrom={resumeFrom}
            onProgress={handleProgress}
            onResumeConfirmed={() => {
              lastSavedRef.current = 0;
              setSavedAt(0);
              saveMovieProgress(titleId!, 0, title.durationMin * 60);
            }}
          />
        )}
      </div>

      {/* ── Metadata section ── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {title.newRelease && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                  NEW
                </Badge>
              )}
              {title.trending && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-2 py-0.5">
                  🔥 TRENDING
                </Badge>
              )}
              {title.content_rating ? (
                <AgeRatingBadge rating={title.content_rating} />
              ) : (
                <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">
                  {title.maturity}
                </Badge>
              )}
              {title.rating > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-400 text-sm font-semibold">
                  <Star className="size-3.5 fill-current" /> {title.rating}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              {title.name}
            </h1>

            {/* Meta row */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/50">
              <span>{title.year}</span>
              {title.durationMin > 0 && (
                <>
                  <span className="size-1 rounded-full bg-white/30" />
                  <span>{title.durationMin} min</span>
                </>
              )}
              {title.language && (
                <>
                  <span className="size-1 rounded-full bg-white/30" />
                  <span>{title.language}</span>
                </>
              )}
              {title.genres.length > 0 && (
                <>
                  <span className="size-1 rounded-full bg-white/30" />
                  <span>{title.genres.join(" · ")}</span>
                </>
              )}
              {savedAt > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/25">
                  Saved at {fmtTime(savedAt)}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                disabled={interactionLoading}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10"
                onClick={async () => {
                  if (!titleId) return;
                  setInteractionLoading(true);
                  try {
                    const next = await toggleList('movie', titleId);
                    setInList(next);
                    toast.success(next ? "Added to My List" : "Removed from My List");
                  } catch {
                    toast.error("Could not update list");
                  } finally {
                    setInteractionLoading(false);
                  }
                }}
              >
                {inList ? (
                  <Check className="mr-2 size-4 text-primary" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}
                {inList ? "In My List" : "My List"}
              </Button>

              <button
                disabled={interactionLoading}
                onClick={async () => {
                  if (!titleId) return;
                  setInteractionLoading(true);
                  try {
                    const next = await toggleLike('movie', titleId);
                    setLiked(next);
                    toast.success(next ? "Thanks for the feedback!" : "Like removed");
                  } catch {
                    toast.error("Could not update like");
                  } finally {
                    setInteractionLoading(false);
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:opacity-60 ${
                  liked
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <ThumbsUp className={`size-4 ${liked ? "fill-current" : ""}`} />
                Like
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Link copied to clipboard!");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
              >
                <Share2 className="size-4" />
                Share
              </button>
            </div>

            {/* Synopsis */}
            {title.synopsis && (
              <p className="mt-6 leading-relaxed text-white/70 max-w-2xl text-sm sm:text-base">
                {title.synopsis}
              </p>
            )}

            {/* Cast & Director */}
            {(title.director || title.cast?.length > 0) && (
              <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 max-w-lg">
                {title.director && (
                  <div>
                    <span className="text-white/40 text-xs uppercase tracking-wider font-medium">
                      Director
                    </span>
                    <p className="mt-1 text-white/80 font-medium">{title.director}</p>
                  </div>
                )}
                {title.cast?.length > 0 && (
                  <div>
                    <span className="text-white/40 text-xs uppercase tracking-wider font-medium">
                      Starring
                    </span>
                    <p className="mt-1 text-white/80 font-medium">{title.cast.join(", ")}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: thumbnail card */}
          <div className="hidden xl:block w-56 shrink-0">
            <img
              src={title.posterUrl}
              alt={title.name}
              className="w-full rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
            />
          </div>
        </div>

        {/* ── More Like This ── */}
        {related.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">More Like This</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white"
                asChild
              >
                <Link to="/browse">
                  See all <ChevronRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {related.map((t) => (
                <TitleCard key={t.id} title={t} fullWidth />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-16" />
    </div>
  );
}
