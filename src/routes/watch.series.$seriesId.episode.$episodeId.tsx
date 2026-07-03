import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import Hls from "hls.js";
import { Protected } from "@/components/streaming/Protected";
import { VideoPlayer } from "@/components/streaming/VideoPlayer";
import { AgeRatingBadge } from "@/components/streaming/AgeRatingBadge";
import { RatingBadge } from "@/components/streaming/RatingBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchSeriesById, fetchEpisodesBySeriesId, fetchEpisodeStreamUrl,
  getEpisodeProgress, saveEpisodeProgress,
  groupEpisodesBySeasons, episodeVideoUrl, episodeThumbnail,
  formatDuration, seriesThumbnail,
  type BackendSeries, type BackendEpisode,
} from "@/lib/series";
import { assetUrl, apiClient } from "@/services/api";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, ArrowLeft, Loader2, ChevronDown, ChevronRight, RotateCcw,
  Subtitles, Settings, Check, Globe
} from "lucide-react";
function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
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
  const user = useSelector((s: RootState) => s.auth.user);
  const [series, setSeries] = useState<BackendSeries | null>(null);
  const [allEpisodes, setAllEpisodes] = useState<BackendEpisode[]>([]);
  const [currentEp, setCurrentEp] = useState<BackendEpisode | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>("");
  const [resumeFrom, setResumeFrom] = useState(0);

  // Throttle: only save when position moved ≥10 s since last save
  const lastSavedRef = useRef(0);

  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);

  useEffect(() => {
    apiClient.get("/stripe/subscription-status")
      .then(({ data }) => {
        if (data?.success && data?.data?.subscription) {
          setSubscription(data.data.subscription);
        }
      })
      .catch((err) => {
        console.error("Failed to load subscription status", err);
      })
      .finally(() => {
        setSubscriptionLoaded(true);
      });
  }, []);

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
            {!subscriptionLoaded ? (
              <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-white/30" />
              </div>
            ) : (!user || ((user.role === "subscriber" || user.role === "affiliate") && !subscription)) ? (
              <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center gap-4">
                <img
                  src={episodeThumbnail(currentEp)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-15"
                />
                <div className="relative z-10 text-center px-6 max-w-md">
                  <div className="size-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
                    <Play className="size-6 text-destructive fill-destructive" />
                  </div>
                  <h3 className="text-white font-extrabold text-lg tracking-tight mb-2">Subscription Required</h3>
                  <p className="text-white/60 text-xs leading-relaxed mb-5">
                    Unlock this episode and stream thousands of premium titles by choosing a StreamVault subscription plan.
                  </p>
                  <Button className="rounded-xl font-bold px-6 shadow-glow-sm" asChild>
                    <Link to="/pricing">Choose a Subscription Plan</Link>
                  </Button>
                </div>
              </div>
            ) : !resolvedVideoUrl ? (
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
              <VideoPlayer
                src={resolvedVideoUrl}
                poster={episodeThumbnail(currentEp)}
                title={`${series.title} — S${currentEp.season_number}E${currentEp.episode_number}`}
                resumeFrom={resumeFrom}
                subtitleUrl={currentEp.subtitle_url}
                dubbedAudioUrl={currentEp.dubbed_audio_url}
                onProgress={handleProgress}
                onResumeConfirmed={() => {
                  lastSavedRef.current = 0;
                  setResumeFrom(0);
                  saveEpisodeProgress(currentEp.id, 0, currentEp.duration || 1800);
                }}
                maxQuality={subscription?.plan?.quality ?? "720"}
              />
            )}
          </div>

          {/* Episode info */}
          <div className="px-4 py-6 sm:px-6 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">S{currentEp.season_number} E{currentEp.episode_number}</Badge>
              {series.content_rating && <AgeRatingBadge rating={series.content_rating} />}
              {currentEp.rating && Number(currentEp.rating) > 0 && <RatingBadge rating={currentEp.rating} />}
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
