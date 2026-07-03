import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import Hls from "hls.js";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Protected } from "@/components/streaming/Protected";
import { TitleCard } from "@/components/streaming/TitleCard";
import { AgeRatingBadge } from "@/components/streaming/AgeRatingBadge";
import { VideoPlayer } from "@/components/streaming/VideoPlayer";
import { RatingBadge } from "@/components/streaming/RatingBadge";
import { ContentWarningModal } from "@/components/streaming/ContentWarningModal";
import type { Title } from "@/lib/mock-data";
import { fetchMovieById, fetchMovies, fetchVideoStreamUrl, getMovieProgress, saveMovieProgress, fetchInteractionStatus, toggleLike, toggleList } from "@/lib/movies";
import { assetUrl, apiClient } from "@/services/api";
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
  Globe,
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

function videoSourceType(url: string): "youtube" | "bunny" | "hls" | "direct" | "none" {
  if (!url) return "none";
  if (extractYouTubeId(url)) return "youtube";
  if (url.includes("mediadelivery.net") || url.includes("bunny")) return "bunny";
  if (url.includes(".m3u8") || url.includes("/hls/")) return "hls";
  return "direct";
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

        if (t.hlsUrl && (t.hlsUrl.includes("/uploads/videos/") || t.hlsUrl.includes("/uploads/hls/"))) {
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

  const isLocalVideo = !!(title.hlsUrl && (title.hlsUrl.includes("/uploads/videos/") || title.hlsUrl.includes("/uploads/hls/")));
  // Use the signed stream URL for local files, fall back to the stored URL for CDN/YouTube
  const effectiveVideoUrl = (isLocalVideo ? resolvedVideoUrl : title.hlsUrl) || "";
  const srcType = videoSourceType(effectiveVideoUrl);
  const youtubeId = srcType === "youtube" ? extractYouTubeId(effectiveVideoUrl) : null;

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.010_258)]">
      {/* Content warning modal */}
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
      <div className="sticky top-0 z-40 flex items-center gap-4 px-4 py-3.5 bg-gradient-to-b from-black/90 via-black/60 to-transparent backdrop-blur-md border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-white/65 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="h-4 w-px bg-white/15" />
        <span className="text-white/55 text-sm font-medium truncate">{title.name}</span>
      </div>

      {/* ── Video Player ── */}
      <div className="w-full bg-black shadow-2xl">
        {!subscriptionLoaded ? (
          <div className="relative w-full aspect-video bg-black flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-white/30" />
          </div>
        ) : (isLocalVideo && !resolvedVideoUrl) ? (
          <div className="relative w-full aspect-video bg-black flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-white/30" />
          </div>
        ) : (!user || ((user.role === "subscriber" || user.role === "affiliate") && !subscription)) ? (
          <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center gap-4">
            <img
              src={title.backdropUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-15"
            />
            <div className="relative z-10 text-center px-6 max-w-md">
              <div className="size-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
                <Play className="size-6 text-destructive fill-destructive" />
              </div>
              <h3 className="text-white font-extrabold text-lg tracking-tight mb-2">Subscription Required</h3>
              <p className="text-white/60 text-xs leading-relaxed mb-5">
                Unlock this content and stream thousands of premium titles by choosing a StreamVault subscription plan.
              </p>
              <Button className="rounded-xl font-bold px-6 shadow-glow-sm" asChild>
                <Link to="/pricing">Choose a Subscription Plan</Link>
              </Button>
            </div>
          </div>
        ) : (title.transcoding_status === "pending" || title.transcoding_status === "processing") ? (
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
        ) : (
          <VideoPlayer
            src={effectiveVideoUrl}
            poster={title.backdropUrl}
            title={title.name}
            durationMin={title.durationMin}
            resumeFrom={resumeFrom}
            subtitleUrl={title.subtitle_url}
            dubbedAudioUrl={title.dubbed_audio_url}
            onProgress={handleProgress}
            onResumeConfirmed={() => {
              lastSavedRef.current = 0;
              setSavedAt(0);
              setResumeFrom(0);
              saveMovieProgress(titleId!, 0, title.durationMin * 60);
            }}
            maxQuality={subscription?.plan?.quality ?? "720"}
          />
        )}
      </div>

      {/* ── Metadata section ── */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {title.newRelease && (
                <span className="inline-flex items-center rounded-full bg-primary/20 border border-primary/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                  New Release
                </span>
              )}
              {title.trending && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/35 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  🔥 Trending
                </span>
              )}
              {title.content_rating ? (
                <AgeRatingBadge rating={title.content_rating} />
              ) : (
                <span className="inline-flex items-center rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-medium text-white/50">
                  {title.maturity}
                </span>
              )}
              {title.rating > 0 && (
                <RatingBadge rating={title.rating} />
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.02em] text-white leading-tight">
              {title.name}
            </h1>

            {/* Meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-white/45">
              <span className="font-medium">{title.year}</span>
              {title.durationMin > 0 && (
                <>
                  <span className="size-1 rounded-full bg-white/25" />
                  <span>{title.durationMin} min</span>
                </>
              )}
              {title.language && (
                <>
                  <span className="size-1 rounded-full bg-white/25" />
                  <span>{title.language}</span>
                </>
              )}
              {title.genres.length > 0 && (
                <>
                  <span className="size-1 rounded-full bg-white/25" />
                  <span className="text-white/55">{title.genres.join(" · ")}</span>
                </>
              )}
              {savedAt > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/25 px-3 py-0.5 text-xs font-semibold text-primary ml-1">
                  <span className="size-1.5 rounded-full bg-primary animate-glow-pulse" />
                  Saved at {fmtTime(savedAt)}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                disabled={interactionLoading}
                className="bg-white/10 hover:bg-white/18 text-white border border-white/12 rounded-xl h-10 px-5 font-semibold backdrop-blur-sm"
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
                {inList ? <Check className="mr-1.5 size-4 text-success" /> : <Plus className="mr-1.5 size-4" />}
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
                className={`inline-flex items-center gap-2 rounded-xl border h-10 px-5 text-sm font-semibold transition-all disabled:opacity-60 ${
                  liked
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-white/12 bg-white/8 text-white/65 hover:bg-white/15 hover:text-white"
                }`}
              >
                <ThumbsUp className={`size-4 ${liked ? "fill-current" : ""}`} />
                {liked ? "Liked" : "Like"}
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Link copied to clipboard!");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/8 h-10 px-5 text-sm font-semibold text-white/65 transition-all hover:bg-white/15 hover:text-white"
              >
                <Share2 className="size-4" />
                Share
              </button>
            </div>

            {/* Synopsis */}
            {title.synopsis && (
              <p className="mt-6 leading-relaxed text-white/65 max-w-2xl text-sm sm:text-base">
                {title.synopsis}
              </p>
            )}

            {/* Cast & Director */}
            {(title.director || title.cast?.length > 0) && (
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:gap-8">
                {title.director && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1.5">Director</p>
                    <p className="text-sm font-semibold text-white/80">{title.director}</p>
                  </div>
                )}
                {title.cast?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1.5">Starring</p>
                    <p className="text-sm font-semibold text-white/80">{title.cast.join(", ")}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: poster card */}
          <div className="hidden xl:block w-52 shrink-0">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-xl" />
              <img
                src={title.posterUrl}
                alt={title.name}
                className="relative w-full rounded-2xl object-cover shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
              />
            </div>
          </div>
        </div>

        {/* ── More Like This ── */}
        {related.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-white tracking-tight">More Like This</h2>
              <Button variant="ghost" size="sm" className="text-white/45 hover:text-white rounded-lg" asChild>
                <Link to="/browse" className="flex items-center gap-1">
                  See all <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {related.map((t) => <TitleCard key={t.id} title={t} fullWidth />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
