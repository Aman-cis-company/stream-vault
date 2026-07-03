import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Loader2, RotateCcw,
  Subtitles, Settings, Check, Globe
} from "lucide-react";
import { assetUrl } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function isHls(url: string) { return url.includes(".m3u8") || url.includes("/hls/"); }
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
    /youtube\.com\/live\/([^?&\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  return null;
}
function isYoutube(url: string) { return !!extractYouTubeId(url); }
function isBunny(url: string) { return url.includes("mediadelivery.net") || url.includes("bunny"); }

export interface Cue {
  start: number;
  end: number;
  text: string;
}

export function parseVtt(text: string): Cue[] {
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
          const cleanStr = str.trim().split(/\s+/)[0];
          const timeParts = cleanStr.split(":");
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

// ── Hover Preview Tooltip ──────────────────────────────────────────────────────

interface VideoPreviewTooltipProps {
  src: string;
  hoverTime: { pct: number; label: string };
  duration: number;
}

function VideoPreviewTooltip({ src, hoverTime, duration }: VideoPreviewTooltipProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const targetTime = (hoverTime.pct / 100) * duration;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (isHls(src) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      video.src = src;
    }
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isFinite(targetTime)) return;
    video.currentTime = targetTime;
  }, [targetTime]);

  return (
    <div
      className="pointer-events-none absolute -top-[132px] z-50 flex flex-col items-center gap-1 rounded-lg bg-black/95 border border-white/10 p-1 shadow-2xl transition-all"
      style={{ left: `clamp(10%, ${hoverTime.pct}%, 90%)`, transform: "translateX(-50%)" }}
    >
      <div className="relative w-40 aspect-video rounded overflow-hidden bg-zinc-900 border border-white/5">
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
      <div className="rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-medium text-white border border-white/5">
        {hoverTime.label}
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95" />
    </div>
  );
}

// ── Unified Video Player Props ────────────────────────────────────────────────

export interface VideoPlayerProps {
  src: string;
  poster: string;
  title: string;
  durationMin?: number;
  resumeFrom?: number;
  subtitleUrl?: string | null;
  dubbedAudioUrl?: string | null;
  onProgress?: (currentTime: number, duration: number) => void;
  onResumeConfirmed?: () => void;
  maxQuality?: string;
}

export function VideoPlayer({
  src,
  poster,
  title,
  durationMin = 0,
  resumeFrom = 0,
  subtitleUrl,
  dubbedAudioUrl,
  onProgress,
  onResumeConfirmed,
  maxQuality = "720"
}: VideoPlayerProps) {
  
  const ytId = isYoutube(src) ? extractYouTubeId(src) : null;
  const isBunnySrc = isBunny(src);

  // If YouTube source type
  if (ytId) {
    const startParam = resumeFrom > 5 ? `&start=${Math.floor(resumeFrom)}` : "";
    const embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1${startParam}`;
    return (
      <div className="relative w-full bg-black select-none overflow-hidden" style={{ maxHeight: "62vh", aspectRatio: "16/7" }}>
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full object-contain border-0"
        />
      </div>
    );
  }

  // If Bunny Stream source type
  if (isBunnySrc) {
    const startParam = resumeFrom > 5 ? `&t=${Math.floor(resumeFrom)}` : "";
    const separator = src.includes("?") ? "&" : "?";
    const finalUrl = `${src}${separator}autoplay=true${startParam}`;
    return (
      <div className="relative w-full bg-black select-none overflow-hidden" style={{ maxHeight: "62vh", aspectRatio: "16/7" }}>
        <iframe
          src={finalUrl}
          title={title}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full object-contain border-0"
        />
      </div>
    );
  }

  // Otherwise, render Native HLS / Direct HTML5 Player
  return (
    <NativeHlsPlayer
      src={src}
      poster={poster}
      title={title}
      durationMin={durationMin}
      resumeFrom={resumeFrom}
      subtitleUrl={subtitleUrl}
      dubbedAudioUrl={dubbedAudioUrl}
      onProgress={onProgress}
      onResumeConfirmed={onResumeConfirmed}
      maxQuality={maxQuality}
    />
  );
}

// ── Native HLS Player Implementation ──────────────────────────────────────────

function NativeHlsPlayer({
  src,
  poster,
  title,
  durationMin,
  resumeFrom = 0,
  subtitleUrl,
  dubbedAudioUrl,
  onProgress,
  onResumeConfirmed,
  maxQuality = "720"
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasSeekRef = useRef(false);
  const resumeFromRef = useRef(resumeFrom);
  resumeFromRef.current = resumeFrom;

  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState((durationMin || 0) * 60);
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

  // Subtitles custom styling states
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitleSize, setSubtitleSize] = useState<"small" | "medium" | "large">("medium");
  const [subtitleColor, setSubtitleColor] = useState<"white" | "yellow">("white");
  const [subtitleBg, setSubtitleBg] = useState<"transparent" | "black">("transparent");
  const [subtitlePos, setSubtitlePos] = useState<"top" | "middle" | "bottom">("bottom");
  const [subtitleCues, setSubtitleCues] = useState<Cue[]>([]);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  // Audio track states & references
  const [audioLanguage, setAudioLanguage] = useState<"eng" | "hin">("eng");
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioLanguageRef = useRef(audioLanguage);
  useEffect(() => {
    audioLanguageRef.current = audioLanguage;
  }, [audioLanguage]);

  // Synchronize audio track playback state, volume, and mute status
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    if (audioLanguage === "hin" && audio) {
      video.muted = true;
      audio.muted = muted;
      audio.volume = volume;

      if (playing) {
        audio.play().catch((e) => console.log("Audio play blocked:", e));
      } else {
        audio.pause();
      }
    } else {
      if (audio) {
        audio.pause();
      }
      video.muted = muted;
      video.volume = volume;
    }
  }, [audioLanguage, playing, muted, volume]);

  // Synchronize audio track current time on seek or timeupdate
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || audioLanguage !== "hin") return;

    const syncTime = () => {
      if (Math.abs(audio.currentTime - video.currentTime) > 0.15) {
        audio.currentTime = video.currentTime;
      }
    };

    video.addEventListener("timeupdate", syncTime);
    video.addEventListener("seeking", syncTime);
    video.addEventListener("seeked", syncTime);
    video.addEventListener("play", syncTime);
    video.addEventListener("playing", syncTime);

    return () => {
      video.removeEventListener("timeupdate", syncTime);
      video.removeEventListener("seeking", syncTime);
      video.removeEventListener("seeked", syncTime);
      video.removeEventListener("play", syncTime);
      video.removeEventListener("playing", syncTime);
    };
  }, [audioLanguage]);

  // Synchronize playback speed rate
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || audioLanguage !== "hin") return;

    const syncRate = () => {
      audio.playbackRate = video.playbackRate;
    };

    video.addEventListener("ratechange", syncRate);
    return () => {
      video.removeEventListener("ratechange", syncRate);
    };
  }, [audioLanguage]);

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

  const tryPlay = (video: HTMLVideoElement) => {
    video.play().catch(() => {
      // Browser blocked unmuted autoplay → fallback to muted
      video.muted = true;
      setMuted(true);
      video.play().catch(() => {});
    });
  };

  // HLS setup + autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setBuffering(true);
    setQualities(["Auto"]);
    setActiveQuality("Auto");

    if (isHls(src) && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setBuffering(false);
        const maxQ = maxQuality ? parseInt(maxQuality, 10) : 720;
        
        let maxLvlIndex = -1;
        for (let i = 0; i < hls.levels.length; i++) {
          if (hls.levels[i].height && hls.levels[i].height <= maxQ) {
            maxLvlIndex = i;
          }
        }
        if (maxLvlIndex !== -1) {
          hls.autoLevelCapping = maxLvlIndex;
        }

        const filteredLevels = data.levels.filter((l) => !l.height || l.height <= maxQ);
        const lvls = filteredLevels.map((l) => (l.height ? `${l.height}p` : "Auto"));
        setQualities(["Auto", ...new Set(lvls)]);
        tryPlay(video);
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
      const onLoadedData = () => {
        setBuffering(false);
        tryPlay(video);
      };
      video.addEventListener("loadeddata", onLoadedData, { once: true });
      return () => {
        video.removeEventListener("loadeddata", onLoadedData);
      };
    }
  }, [src, maxQuality]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => {
      setCurrentTime(v.currentTime);
      if (isFinite(v.duration) && v.duration > 0) {
        onProgress?.(v.currentTime, v.duration);
        if (resumeFromRef.current > 5 && !hasSeekRef.current) {
          hasSeekRef.current = true;
          v.currentTime = resumeFromRef.current;
          setShowResumeBanner(true);
        }
      }
    };
    const onDur = () => { if (isFinite(v.duration)) setDuration(v.duration); };
    const onPlayEvent = () => {
      setPlaying(true);
      const audio = audioRef.current;
      if (audioLanguageRef.current === "hin" && audio) {
        audio.play().catch((e) => console.log("Audio play blocked:", e));
      }
    };
    const onPauseEvent = () => {
      setPlaying(false);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
    };
    const onWait = () => {
      setBuffering(true);
      const audio = audioRef.current;
      if (audioLanguageRef.current === "hin" && audio) {
        audio.pause();
      }
    };
    const onPlayingEvent = () => {
      setBuffering(false);
      const audio = audioRef.current;
      if (audioLanguageRef.current === "hin" && audio) {
        audio.play().catch((e) => console.log("Audio play blocked:", e));
      }
    };
    const onProg = () => {
      if (v.buffered.length && v.duration)
        setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    };
    const onVol = () => {
      if (audioLanguageRef.current !== "hin") {
        setVolume(v.volume);
        setMuted(v.muted);
      }
    };
    const onFs = () => setFullscreen(!!document.fullscreenElement);

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("durationchange", onDur);
    v.addEventListener("play", onPlayEvent);
    v.addEventListener("pause", onPauseEvent);
    v.addEventListener("waiting", onWait);
    v.addEventListener("playing", onPlayingEvent);
    v.addEventListener("progress", onProg);
    v.addEventListener("volumechange", onVol);
    document.addEventListener("fullscreenchange", onFs);

    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("durationchange", onDur);
      v.removeEventListener("play", onPlayEvent);
      v.removeEventListener("pause", onPauseEvent);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("playing", onPlayingEvent);
      v.removeEventListener("progress", onProg);
      v.removeEventListener("volumechange", onVol);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [onProgress]);

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
    setVolume(val);
    const newMuted = val === 0;
    setMuted(newMuted);
    if (audioLanguage !== "hin") {
      v.volume = val;
      v.muted = newMuted;
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.volume = val;
        audio.muted = newMuted;
        if (!newMuted && playing) {
          audio.play().catch((e) => console.log("Audio play blocked:", e));
        }
      }
    }
  };

  const toggleMute = () => {
    const v = videoRef.current; if (!v) return;
    const newMuted = !muted;
    setMuted(newMuted);
    if (audioLanguage !== "hin") {
      v.muted = newMuted;
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.muted = newMuted;
        if (!newMuted && playing) {
          audio.play().catch((e) => console.log("Audio play blocked:", e));
        }
      }
    }
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

  const activeCue = subtitlesEnabled
    ? subtitleCues.find((c) => currentTime >= c.start && currentTime <= c.end)
    : null;

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

      {/* Dubbed audio element */}
      {dubbedAudioUrl && (
        <audio
          ref={audioRef}
          src={assetUrl(dubbedAudioUrl)}
          preload="auto"
          className="hidden"
        />
      )}

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
          onClick={() => {
            const v = videoRef.current;
            if (v) {
              v.muted = false;
              setMuted(false);
              if (audioLanguage === "hin") {
                const audio = audioRef.current;
                if (audio) {
                  audio.muted = false;
                  audio.play().catch((e) => console.log("Audio play blocked:", e));
                }
              }
            }
          }}
          className="absolute top-3 right-3 z-30 flex items-center gap-2 rounded-full bg-black/70 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white border border-white/20 hover:bg-black/90 transition-colors"
        >
          <VolumeX className="size-3.5 text-amber-400" />
          <span className="text-amber-300">Tap to unmute</span>
        </button>
      )}

      {/* Resume banner */}
      {showResumeBanner && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-lg bg-black/85 backdrop-blur-sm px-4 py-2.5 text-sm text-white border border-white/15 shadow-2xl whitespace-nowrap">
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

      {/* Controls panel */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 transition-all duration-300 ${
          showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Custom Progress bar / Seek bar */}
        <div
          className="group/seek relative mx-3 mb-2.5 h-[3px] cursor-pointer rounded-full bg-white/20 hover:h-[5px] transition-all"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * 100);
          }}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Buffered timeline segment */}
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${buffered}%` }} />
          {/* Current play progress */}
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${progress}%` }} />
          {hoverTime && (
            <VideoPreviewTooltip src={src} hoverTime={hoverTime} duration={duration} />
          )}
        </div>

        {/* Action Controls buttons bar */}
        <div className="flex items-center gap-1.5 px-3 pb-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all"
          >
            {playing ? (
              <Pause className="size-[18px] fill-white text-white" />
            ) : (
              <Play className="size-[18px] fill-white text-white ml-0.5" />
            )}
          </button>

          {/* Jump backwards 10s */}
          <button
            onClick={() => skip(-10)}
            className="hidden sm:flex size-9 items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all"
          >
            <SkipBack className="size-[15px] text-white/80" />
          </button>

          {/* Jump forwards 10s */}
          <button
            onClick={() => skip(10)}
            className="hidden sm:flex size-9 items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all"
          >
            <SkipForward className="size-[15px] text-white/80" />
          </button>

          {/* Volume toggle & slider */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10"
            >
              {muted || volume === 0 ? (
                <VolumeX className="size-[15px] text-white/80" />
              ) : (
                <Volume2 className="size-[15px] text-white/80" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => setVol(Number(e.target.value))}
              className="w-16 accent-primary cursor-pointer hidden md:block"
              aria-label="Volume"
            />
          </div>

          {/* Time indicator */}
          <span className="ml-1 hidden md:block text-[11px] tabular-nums text-white/60">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>

          <div className="flex-1" />
          <span className="hidden lg:block text-[11px] text-white/50 truncate max-w-[200px] font-medium">{title}</span>
          <div className="flex-1" />

          {/* Playback speed selector */}
          <div className="relative">
            <button
              onClick={() => {
                const video = videoRef.current;
                if (video) {
                  const rates = [0.5, 1.0, 1.25, 1.5, 2.0];
                  const currentIdx = rates.indexOf(video.playbackRate);
                  const nextIdx = (currentIdx + 1) % rates.length;
                  video.playbackRate = rates[nextIdx];
                  toast.success(`Speed: ${rates[nextIdx]}x`);
                }
              }}
              className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10 text-[10px] font-bold text-white/70 active:scale-95"
              title="Playback Speed"
            >
              {videoRef.current ? `${videoRef.current.playbackRate}x` : "1.0x"}
            </button>
          </div>

          {/* Custom Subtitles Menu */}
          <div className="relative">
            <button
              className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
              onClick={() => {
                setShowSubtitleMenu((v) => !v);
                setShowAudioMenu(false);
                setShowSettings(false);
                resetHide();
              }}
              aria-label="Subtitles"
            >
              <Subtitles className={`size-[15px] ${subtitlesEnabled ? "text-primary font-bold" : "text-white/70"}`} />
            </button>

            {showSubtitleMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-72 rounded-xl border border-white/10 bg-[#0c0c10]/95 backdrop-blur-xl p-4 shadow-2xl z-50 text-white flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Subtitles Settings</span>
                  <button
                    onClick={() => {
                      if (!subtitleUrl) {
                        toast.error("No subtitles available for this content.");
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

          {/* Secondary Dubbed Audio Switcher */}
          {dubbedAudioUrl && (
            <div className="relative">
              <button
                className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
                onClick={() => {
                  setShowAudioMenu((v) => !v);
                  setShowSubtitleMenu(false);
                  setShowSettings(false);
                  resetHide();
                }}
                aria-label="Audio Language"
              >
                <Globe className={`size-[15px] ${audioLanguage === "hin" ? "text-primary font-bold" : "text-white/70"}`} />
              </button>

              {showAudioMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-white/10 bg-[#0c0c10]/95 backdrop-blur-xl p-4 shadow-2xl z-50 text-white flex flex-col gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 border-b border-white/5 pb-2 text-left">Audio Track</span>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setAudioLanguage("eng");
                        setShowAudioMenu(false);
                        const audio = audioRef.current;
                        if (audio) {
                          audio.pause();
                        }
                      }}
                      className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        audioLanguage === "eng" ? "text-primary bg-primary/10 font-semibold" : "text-white/75 hover:bg-white/5"
                      }`}
                    >
                      <span>English (Original)</span>
                      {audioLanguage === "eng" && <Check className="size-3.5 text-primary" />}
                    </button>
                    <button
                      onClick={() => {
                        setAudioLanguage("hin");
                        setShowAudioMenu(false);
                        const video = videoRef.current;
                        const audio = audioRef.current;
                        if (video && !video.paused && audio) {
                          audio.currentTime = video.currentTime;
                          audio.play().catch((e) => console.log("Audio play blocked:", e));
                        }
                      }}
                      className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        audioLanguage === "hin" ? "text-primary bg-primary/10 font-semibold" : "text-white/75 hover:bg-white/5"
                      }`}
                    >
                      <span>Hindi (AI Dubbed)</span>
                      {audioLanguage === "hin" && <Check className="size-3.5 text-primary" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quality Cap Level Selector */}
          {qualities.length > 1 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettings((v) => !v);
                  setShowSubtitleMenu(false);
                  setShowAudioMenu(false);
                  resetHide();
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-white/10 active:scale-95 transition-all"
              >
                <Settings className="size-[14px] text-white/70" />
                <span className="hidden sm:block text-[10px] font-semibold text-white/60">{activeQuality}</span>
              </button>
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 w-32 rounded-xl border border-white/10 bg-[#111]/95 backdrop-blur-xl overflow-hidden shadow-2xl z-50">
                  <p className="px-3 py-2 text-[9px] font-semibold uppercase tracking-widest text-white/30 border-b border-white/5 text-left">Quality</p>
                  {qualities.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setActiveQuality(q);
                        setShowSettings(false);
                        if (hlsRef.current) {
                          if (q !== "Auto") {
                            const lvl = hlsRef.current.levels.findIndex((l) => `${l.height}p` === q);
                            if (lvl >= 0) hlsRef.current.currentLevel = lvl;
                          } else {
                            hlsRef.current.currentLevel = -1;
                          }
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

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="flex size-9 items-center justify-center rounded-lg hover:bg-white/10 active:scale-95 transition-all"
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize className="size-[15px] text-white/80" />
            ) : (
              <Maximize className="size-[15px] text-white/80" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
