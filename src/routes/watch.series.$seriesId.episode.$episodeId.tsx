import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Hls from "hls.js";
import { Protected } from "@/components/streaming/Protected";
import { AgeRatingBadge } from "@/components/streaming/AgeRatingBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchSeriesById, fetchEpisodesBySeriesId, fetchEpisodeStreamUrl,
  getEpisodeProgress, saveEpisodeProgress,
  groupEpisodesBySeasons, episodeVideoUrl, episodeThumbnail,
  formatDuration, seriesThumbnail,
  type BackendSeries, type BackendEpisode,
} from "@/lib/series";
import { assetUrl } from "@/services/api";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, ArrowLeft, Loader2, ChevronDown, ChevronRight, RotateCcw,
  Subtitles, Settings, Check
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function isHls(url: string) { return url.includes(".m3u8") || url.includes("/hls/"); }
function isYoutube(url: string) { return url.includes("youtube.com") || url.includes("youtu.be"); }
function extractYouTubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&\s]+)/);
  return m ? m[1] : null;
}

// ── Video Player ──────────────────────────────────────────────────────────────

interface EpisodePlayerProps {
  src: string;
  poster: string;
  title: string;
  resumeFrom?: number;
  subtitleUrl?: string | null;
  onProgress?: (currentTime: number, duration: number) => void;
  onResumeConfirmed?: () => void;
}

interface Cue {
  start: number;
  end: number;
  text: string;
}

function parseVtt(text: string): Cue[] {
  const lines = text.split(/\r?\n/);
  const cues: Cue[] = [];
  let currentCue: Cue | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("-->")) {
      const parts = line.split("-->").map(p => p.trim());
      if (parts.length === 2) {
        const [startStr, endStr] = parts;
        const parseTime = (str: string) => {
          const timeParts = str.split(":");
          let seconds = 0;
          if (timeParts.length === 3) {
            seconds = parseFloat(timeParts[0]) * 3600 + parseFloat(timeParts[1]) * 60 + parseFloat(timeParts[2]);
          } else if (timeParts.length === 2) {
            seconds = parseFloat(timeParts[0]) * 60 + parseFloat(timeParts[1]);
          }
          return seconds;
        };
        currentCue = {
          start: parseTime(startStr),
          end: parseTime(endStr),
          text: ""
        };
        cues.push(currentCue);
      }
    } else if (currentCue && line && !line.startsWith("WEBVTT")) {
      currentCue.text = currentCue.text ? currentCue.text + "\n" + line : line;
    }
  }
  return cues;
}

function EpisodePlayer({ src, poster, title, resumeFrom = 0, subtitleUrl, onProgress, onResumeConfirmed }: EpisodePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasSeekRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  // Subtitles custom styling states
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitleSize, setSubtitleSize] = useState<"small" | "medium" | "large">("medium");
  const [subtitleColor, setSubtitleColor] = useState<"white" | "yellow">("white");
  const [subtitleBg, setSubtitleBg] = useState<"transparent" | "black">("transparent");
  const [subtitlePos, setSubtitlePos] = useState<"top" | "middle" | "bottom">("bottom");
  const [subtitleCues, setSubtitleCues] = useState<Cue[]>([]);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  // Fetch and parse WebVTT file
  useEffect(() => {
    if (!subtitleUrl) {
      setSubtitleCues([]);
      setSubtitlesEnabled(false);
      return;
    }
    const url = assetUrl(subtitleUrl);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("VTT file not found");
        return r.text();
      })
      .then((text) => {
        const cues = parseVtt(text);
        setSubtitleCues(cues);
        setSubtitlesEnabled(true); // Enable by default if subtitles are present!
      })
      .catch((err) => {
        console.error("Failed to fetch/parse subtitles:", err);
        setSubtitleCues([]);
        setSubtitlesEnabled(false);
      });
  }, [subtitleUrl]);

  // Seek to resume position once the video has enough metadata
  const handleReady = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setBuffering(false);
    if (resumeFrom > 5 && !hasSeekRef.current) {
      hasSeekRef.current = true;
      video.currentTime = resumeFrom;
      setShowResumeBanner(true);
    }
    video.play().catch(() => { video.muted = true; setMuted(true); video.play().catch(() => {}); });
  }, [resumeFrom]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    hasSeekRef.current = false;
    setBuffering(true);
    setShowResumeBanner(false);

    if (isYoutube(src)) return;

    if (isHls(src) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, handleReady);
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) hls.recoverMediaError(); });
      return () => { hls.destroy(); hlsRef.current = null; };
    } else {
      video.src = src;
      video.load();
      video.addEventListener("loadedmetadata", handleReady, { once: true });
    }
  }, [src, handleReady]);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const handlers = {
      timeupdate: () => {
        setCurrentTime(v.currentTime);
        if (isFinite(v.duration) && v.duration > 0) onProgress?.(v.currentTime, v.duration);
      },
      durationchange: () => { if (isFinite(v.duration)) setDuration(v.duration); },
      play: () => setPlaying(true), pause: () => setPlaying(false),
      waiting: () => setBuffering(true), playing: () => setBuffering(false),
      progress: () => { if (v.buffered.length && v.duration) setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100); },
      volumechange: () => { setVolume(v.volume); setMuted(v.muted); },
    };
    Object.entries(handlers).forEach(([e, h]) => v.addEventListener(e, h));
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => { Object.entries(handlers).forEach(([e, h]) => v.removeEventListener(e, h)); document.removeEventListener("fullscreenchange", onFs); };
  }, [onProgress]);

  const resetHide = useCallback(() => {
    setShowControls(true); clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const ytId = isYoutube(src) ? extractYouTubeId(src) : null;

  const activeCue = subtitlesEnabled
    ? subtitleCues.find((c) => currentTime >= c.start && currentTime <= c.end)
    : null;

  if (ytId) {
    return (
      <div className="relative w-full aspect-video bg-black">
        <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&start=${Math.floor(resumeFrom)}`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 w-full h-full border-0" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full bg-black select-none overflow-hidden" style={{ maxHeight: "62vh", aspectRatio: "16/7" }}
      onMouseMove={resetHide} onMouseLeave={() => { if (playing) setShowControls(false); }}
      onDoubleClick={() => document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen()}>
      <video ref={videoRef} className="w-full h-full object-contain" poster={poster} playsInline
        onClick={() => { const v = videoRef.current; if (!v) return; v.paused ? v.play() : v.pause(); }} />

      {/* Subtitles Custom Overlay */}
      {subtitlesEnabled && activeCue && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center max-w-[85%] transition-all duration-200 ${
            subtitlePos === "top"
              ? "top-[10%]"
              : subtitlePos === "middle"
              ? "top-1/2 -translate-y-1/2"
              : "bottom-[16%]"
          }`}
        >
          <span
            className={`inline-block whitespace-pre-line font-medium tracking-wide leading-relaxed drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] [text-shadow:_0_1px_4px_rgb(0_0_0)] ${
              subtitleSize === "small"
                ? "text-sm sm:text-base"
                : subtitleSize === "large"
                ? "text-lg sm:text-2xl md:text-3xl lg:text-4xl"
                : "text-base sm:text-xl md:text-2xl"
            } ${
              subtitleColor === "yellow" ? "text-yellow-400" : "text-white"
            } ${
              subtitleBg === "black" ? "bg-black/75 px-4 py-2 rounded-md" : ""
            }`}
          >
            {activeCue.text}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.25) 100%)" }} />

      {buffering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
          <div className="relative size-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-white animate-spin" />
          </div>
        </div>
      )}

      {/* Resume banner */}
      {showResumeBanner && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl bg-black/80 backdrop-blur-sm border border-white/15 px-4 py-3 shadow-xl">
          <RotateCcw className="size-4 text-primary shrink-0" />
          <span className="text-sm text-white/90">Resumed from <span className="font-semibold text-white">{fmtTime(resumeFrom)}</span></span>
          <button
            className="ml-1 text-xs text-white/50 hover:text-white underline-offset-2 hover:underline transition-colors"
            onClick={() => {
              const v = videoRef.current; if (v) v.currentTime = 0;
              setShowResumeBanner(false);
              onResumeConfirmed?.();
            }}
          >
            Start over
          </button>
          <button className="ml-1 text-white/40 hover:text-white transition-colors" onClick={() => setShowResumeBanner(false)}>✕</button>
        </div>
      )}

      <div className={`absolute inset-x-0 bottom-0 z-30 transition-all duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {/* Seek bar */}
        <div className="group/seek relative mx-3 mb-2 h-[3px] cursor-pointer rounded-full bg-white/20 hover:h-[5px] transition-all"
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); const v = videoRef.current; if (!v || !isFinite(v.duration)) return; v.currentTime = ((e.clientX - r.left) / r.width) * v.duration; }}>
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${buffered}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        {/* Controls */}
        <div className="flex items-center gap-1 px-3 pb-3">
          <button onClick={() => { const v = videoRef.current; if (!v) return; v.paused ? v.play() : v.pause(); resetHide(); }} className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10">
            {playing ? <Pause className="size-[18px] fill-white text-white" /> : <Play className="size-[18px] fill-white text-white ml-0.5" />}
          </button>
          <button onClick={() => { const v = videoRef.current; if (v) { v.currentTime = Math.max(0, v.currentTime - 10); resetHide(); } }} className="hidden sm:flex size-9 items-center justify-center rounded-lg hover:bg-white/10"><SkipBack className="size-[15px] text-white/80" /></button>
          <button onClick={() => { const v = videoRef.current; if (v) { v.currentTime = Math.min(v.duration || 0, v.currentTime + 10); resetHide(); } }} className="hidden sm:flex size-9 items-center justify-center rounded-lg hover:bg-white/10"><SkipForward className="size-[15px] text-white/80" /></button>
          <button onClick={() => { const v = videoRef.current; if (v) v.muted = !v.muted; }} className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10">
            {muted || volume === 0 ? <VolumeX className="size-[15px] text-white/80" /> : <Volume2 className="size-[15px] text-white/80" />}
          </button>
          <span className="ml-1 hidden md:block text-[11px] tabular-nums text-white/60">{fmtTime(currentTime)} / {fmtTime(duration)}</span>
          <div className="flex-1" />
          <span className="hidden lg:block text-[11px] text-white/50 truncate max-w-[200px]">{title}</span>
          <div className="flex-1" />
          {/* Subtitles */}
          <div className="relative">
            <button
              className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
              onClick={() => {
                setShowSubtitleMenu((v) => !v);
                resetHide();
              }}
              aria-label="Subtitles"
            >
              <Subtitles className={`size-[15px] ${subtitlesEnabled ? "text-primary font-bold" : "text-white/70"}`} />
            </button>

            {/* Subtitles Customization Dropdown */}
            {showSubtitleMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-72 rounded-xl border border-white/10 bg-[#0c0c10]/95 backdrop-blur-xl p-4 shadow-2xl z-50 text-white flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Subtitles Settings</span>
                  <button
                    onClick={() => {
                      if (!subtitleUrl) {
                        toast.error("No subtitles available for this episode.");
                        setSubtitlesEnabled(false);
                      } else {
                        setSubtitlesEnabled((v) => !v);
                      }
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded transition-all font-semibold ${
                      subtitlesEnabled ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-white/60 border border-white/10"
                    }`}
                  >
                    {subtitlesEnabled ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Size Option */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-white/40 font-semibold uppercase text-left">Text Size</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(["small", "medium", "large"] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSubtitleSize(sz)}
                        className={`text-[10px] py-1 rounded transition-all capitalize border ${
                          subtitleSize === sz
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "bg-white/5 border-transparent text-white/65 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Option */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-white/40 font-semibold uppercase text-left">Text Color</span>
                  <div className="grid grid-cols-2 gap-1">
                    {(["white", "yellow"] as const).map((col) => (
                      <button
                        key={col}
                        onClick={() => setSubtitleColor(col)}
                        className={`text-[10px] py-1 rounded transition-all capitalize border ${
                          subtitleColor === col
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "bg-white/5 border-transparent text-white/65 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Option */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-white/40 font-semibold uppercase text-left">Background Style</span>
                  <div className="grid grid-cols-2 gap-1">
                    {(["transparent", "black"] as const).map((bgStyle) => (
                      <button
                        key={bgStyle}
                        onClick={() => setSubtitleBg(bgStyle)}
                        className={`text-[10px] py-1 rounded transition-all capitalize border ${
                          subtitleBg === bgStyle
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "bg-white/5 border-transparent text-white/65 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        {bgStyle === "black" ? "Dark Box" : "No Box"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position Option */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-white/40 font-semibold uppercase text-left">Vertical Position</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(["top", "middle", "bottom"] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setSubtitlePos(pos)}
                        className={`text-[10px] py-1 rounded transition-all capitalize border ${
                          subtitlePos === pos
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "bg-white/5 border-transparent text-white/65 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen()} className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10">
            {fullscreen ? <Minimize className="size-[15px] text-white/80" /> : <Maximize className="size-[15px] text-white/80" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Episode Sidebar ───────────────────────────────────────────────────────────

function EpisodeSidebar({ series, episodes, currentEpId, onSelect }: { series: BackendSeries; episodes: BackendEpisode[]; currentEpId: number; onSelect: (ep: BackendEpisode) => void }) {
  const seasonMap = groupEpisodesBySeasons(episodes);
  const seasons = Object.keys(seasonMap).map(Number).sort((a, b) => a - b);
  const [expanded, setExpanded] = useState<Record<number, boolean>>(Object.fromEntries(seasons.map((s) => [s, true])));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <img src={seriesThumbnail(series)} alt={series.title} className="size-8 rounded object-cover shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{series.title}</p>
            <p className="text-xs text-muted-foreground">{episodes.length} episodes</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {seasons.map((s) => (
          <div key={s}>
            <button className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium hover:bg-secondary/30 transition-colors text-left"
              onClick={() => setExpanded((p) => ({ ...p, [s]: !p[s] }))}>
              Season {s}
              {expanded[s] ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
            </button>
            {expanded[s] && (seasonMap[s] ?? []).map((ep) => (
              <button key={ep.id} onClick={() => onSelect(ep)}
                className={`w-full flex gap-3 px-3 py-2 text-left hover:bg-secondary/40 transition-colors ${ep.id === currentEpId ? "bg-primary/10 border-l-2 border-primary" : ""}`}>
                <div className="relative shrink-0 rounded overflow-hidden bg-secondary" style={{ width: 72, aspectRatio: "16/9" }}>
                  <img src={episodeThumbnail(ep)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  {ep.id === currentEpId && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Play className="size-3 fill-white text-white" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] ${ep.id === currentEpId ? "text-primary font-semibold" : "text-muted-foreground"}`}>E{ep.episode_number}</p>
                  <p className="text-xs font-medium leading-tight line-clamp-2">{ep.title}</p>
                  {ep.duration && <p className="text-[10px] text-muted-foreground mt-0.5">{formatDuration(ep.duration)}</p>}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WatchEpisodePage() {
  return (
    <Protected>
      <WatchEpisodeInner />
    </Protected>
  );
}

function WatchEpisodeInner() {
  const { seriesId, episodeId } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState<BackendSeries | null>(null);
  const [allEpisodes, setAllEpisodes] = useState<BackendEpisode[]>([]);
  const [currentEp, setCurrentEp] = useState<BackendEpisode | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>("");
  const [resumeFrom, setResumeFrom] = useState(0);

  // Throttle: only save when position moved ≥10 s since last save
  const lastSavedRef = useRef(0);

  useEffect(() => {
    if (!seriesId) return;
    Promise.all([fetchSeriesById(seriesId), fetchEpisodesBySeriesId(seriesId)])
      .then(([s, eps]) => {
        setSeries(s);
        const published = eps.filter((e) => e.status === "published");
        setAllEpisodes(published);
        const target = published.find((e) => String(e.id) === episodeId) ?? published[0] ?? null;
        setCurrentEp(target);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [seriesId]);

  useEffect(() => {
    if (!episodeId || allEpisodes.length === 0) return;
    const ep = allEpisodes.find((e) => String(e.id) === episodeId);
    if (ep) setCurrentEp(ep);
  }, [episodeId, allEpisodes]);

  // Resolve video URL (signed token for local files)
  useEffect(() => {
    if (!currentEp) { setResolvedVideoUrl(""); return; }
    if (currentEp.provider_name === "local") {
      setResolvedVideoUrl("");
      fetchEpisodeStreamUrl(currentEp.id).then((url) => setResolvedVideoUrl(url ?? ""));
    } else {
      setResolvedVideoUrl(episodeVideoUrl(currentEp));
    }
  }, [currentEp]);

  // Load saved progress whenever the episode changes
  useEffect(() => {
    if (!currentEp) { setResumeFrom(0); return; }
    lastSavedRef.current = 0;
    getEpisodeProgress(currentEp.id).then((p) => {
      // Only resume if watched >5 s and not essentially complete (≥95%)
      if (p && p.watch_time > 5 && Number(p.completion_percentage) < 95) {
        setResumeFrom(p.watch_time);
      } else {
        setResumeFrom(0);
      }
    });
  }, [currentEp?.id]);

  // Save progress — called from player's onProgress, throttled to every 10 s
  const handleProgress = useCallback((currentTime: number, duration: number) => {
    if (!currentEp || !duration || currentTime < 5) return;
    if (currentTime - lastSavedRef.current < 10) return;
    lastSavedRef.current = currentTime;
    saveEpisodeProgress(currentEp.id, currentTime, duration);
  }, [currentEp]);

  function selectEpisode(ep: BackendEpisode) {
    setCurrentEp(ep);
    navigate(`/watch/series/${seriesId}/episode/${ep.id}`, { replace: true });
  }

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="size-10 animate-spin text-white/40" /></div>;
  }

  if (!series || !currentEp) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-white/60">Episode not found</p>
        <Button asChild variant="secondary"><Link to="/browse">Back to Browse</Link></Button>
      </div>
    );
  }

  const currentIdx = allEpisodes.findIndex((e) => e.id === currentEp.id);
  const nextEp = allEpisodes[currentIdx + 1] ?? null;
  const prevEp = allEpisodes[currentIdx - 1] ?? null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Navbar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm shrink-0">
        <button onClick={() => navigate(`/series/${series.id}`)} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors">
          <ArrowLeft className="size-4" /> {series.title}
        </button>
        <span className="text-white/30">·</span>
        <span className="text-white/70 text-sm truncate">S{currentEp.season_number} E{currentEp.episode_number} · {currentEp.title}</span>
      </div>

      {/* Player + Sidebar */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Player column */}
        <div className="flex-1 min-w-0">
          <div className="w-full bg-black">
            {!resolvedVideoUrl ? (
              <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                <img src={episodeThumbnail(currentEp)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                <div className="relative text-center">
                  {currentEp.provider_name === "local" && !resolvedVideoUrl ? (
                    <><Loader2 className="size-8 text-white/30 mx-auto animate-spin" /><p className="text-white/40 text-sm mt-2">Loading video…</p></>
                  ) : (
                    <><Play className="size-10 text-white/20 mx-auto" /><p className="text-white/40 text-sm mt-2">No video source</p></>
                  )}
                </div>
              </div>
            ) : (
              <EpisodePlayer
                src={resolvedVideoUrl}
                poster={episodeThumbnail(currentEp)}
                title={`${series.title} — S${currentEp.season_number}E${currentEp.episode_number}`}
                resumeFrom={resumeFrom}
                subtitleUrl={currentEp.subtitle_url}
                onProgress={handleProgress}
              />
            )}
          </div>

          {/* Episode info */}
          <div className="px-4 py-6 sm:px-6 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">S{currentEp.season_number} E{currentEp.episode_number}</Badge>
              {series.content_rating && <AgeRatingBadge rating={series.content_rating} />}
              {currentEp.duration && <span className="text-sm text-muted-foreground">{formatDuration(currentEp.duration)}</span>}
              {resumeFrom > 5 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/25 px-2 py-0.5 text-xs text-primary font-medium">
                  <RotateCcw className="size-3" /> Saved at {fmtTime(resumeFrom)}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">{currentEp.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{series.title}</p>
            {currentEp.description && <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{currentEp.description}</p>}

            {/* Prev / Next */}
            <div className="mt-5 flex gap-3">
              {prevEp && (
                <Button variant="secondary" size="sm" onClick={() => selectEpisode(prevEp)}>
                  <SkipBack className="mr-1.5 size-3.5" /> Prev: E{prevEp.episode_number}
                </Button>
              )}
              {nextEp && (
                <Button size="sm" onClick={() => selectEpisode(nextEp)}>
                  Next: E{nextEp.episode_number} <SkipForward className="ml-1.5 size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Episode sidebar */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border bg-card/50 overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px)" }}>
          <EpisodeSidebar series={series} episodes={allEpisodes} currentEpId={currentEp.id} onSelect={selectEpisode} />
        </div>
      </div>
    </div>
  );
}
