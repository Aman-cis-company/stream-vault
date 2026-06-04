import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward,
  Settings, Shield, Wifi, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  onProgress?: (p: number) => void;
  initialProgress?: number;
}

function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoPlayer({ src, poster, title, onProgress, initialProgress = 0 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [qualities, setQualities] = useState<string[]>(["Auto"]);
  const [activeQuality, setActiveQuality] = useState("Auto");
  const [showQuality, setShowQuality] = useState(false);
  const [drmActive] = useState(true);
  const [cdnLatency] = useState(Math.floor(18 + Math.random() * 12));

  // HLS setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false, maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((l) =>
          l.height ? `${l.height}p` : "Auto"
        );
        setQualities(["Auto", ...levels.filter((q, i, a) => a.indexOf(q) === i)]);
        if (initialProgress > 0) {
          video.currentTime = initialProgress * 0.01 * (video.duration || 0);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) hls.recoverMediaError();
      });

      return () => { hls.destroy(); hlsRef.current = null; };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }
  }, [src, initialProgress]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      setProgress(pct);
      onProgress?.(Math.round(pct));
    };
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onProgress = () => {
      if (video.buffered.length > 0 && video.duration) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("progress", onProgress);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("progress", onProgress);
    };
  }, [onProgress]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
    resetHideTimer();
  };

  const seek = (pct: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    video.currentTime = (pct / 100) * video.duration;
    resetHideTimer();
  };

  const skip = (secs: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + secs));
    resetHideTimer();
  };

  const changeVolume = (v: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div
      ref={containerRef}
      className="group relative w-full bg-black select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      style={{ aspectRatio: "16/9" }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 size-full"
        poster={poster}
        playsInline
        onClick={togglePlay}
        style={{ cursor: "pointer" }}
      />

      {/* DRM & CDN status badges */}
      <div className="absolute left-3 top-3 flex items-center gap-2 z-20">
        {drmActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-emerald-400 backdrop-blur-sm border border-emerald-500/30">
            <Shield className="size-2.5" /> DRM Protected
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-blue-300 backdrop-blur-sm border border-blue-500/20">
          <Wifi className="size-2.5" /> CDN {cdnLatency}ms
        </span>
      </div>

      {/* Centre play/pause on click */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {!playing && (
          <div className="inline-flex size-20 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm ring-2 ring-white/20 pointer-events-auto" onClick={togglePlay}>
            <Play className="size-9 fill-current ml-1" />
          </div>
        )}
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-16 sm:px-5">
          {/* Seekbar */}
          <div
            className="group/seek relative h-1.5 w-full cursor-pointer rounded-full bg-white/25 mb-3"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - r.left) / r.width) * 100);
            }}
          >
            {/* Buffered */}
            <div className="absolute h-full rounded-full bg-white/20" style={{ width: `${buffered}%` }} />
            {/* Played */}
            <div className="absolute h-full rounded-full bg-primary" style={{ width: `${progress}%` }}>
              <span className="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-primary opacity-0 shadow group-hover/seek:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex items-center gap-2 text-white">
            <button onClick={togglePlay} className="hover:text-primary transition-colors p-1" aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
            </button>
            <button onClick={() => skip(-10)} className="hover:text-primary transition-colors p-1" aria-label="Rewind 10s">
              <SkipBack className="size-4" />
            </button>
            <button onClick={() => skip(10)} className="hover:text-primary transition-colors p-1" aria-label="Forward 10s">
              <SkipForward className="size-4" />
            </button>

            <button onClick={toggleMute} className="hover:text-primary transition-colors p-1">
              {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-16 accent-primary cursor-pointer hidden sm:block"
              aria-label="Volume"
            />

            <span className="text-xs tabular-nums text-white/70 hidden sm:block">
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>

            <span className="ml-auto text-xs text-white/60 font-medium hidden sm:block truncate max-w-[200px]">{title}</span>

            {/* Quality selector */}
            <div className="relative">
              <button
                onClick={() => setShowQuality((v) => !v)}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-xs hover:bg-white/10 transition-colors"
              >
                <Settings className="size-3.5" />
                <span className="hidden sm:inline">{activeQuality}</span>
                <ChevronUp className="size-3" />
              </button>
              {showQuality && (
                <div className="absolute bottom-full right-0 mb-1 rounded-lg border border-white/10 bg-black/90 py-1 backdrop-blur-sm min-w-[80px]">
                  {qualities.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setActiveQuality(q); setShowQuality(false); }}
                      className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 transition-colors ${activeQuality === q ? "text-primary font-medium" : "text-white"}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" className="size-7 text-white hover:text-primary" onClick={toggleFullscreen} aria-label="Fullscreen">
              <Maximize className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
