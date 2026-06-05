import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Protected } from "@/components/streaming/Protected";
import { AgeRatingBadge } from "@/components/streaming/AgeRatingBadge";
import { ContentWarningModal } from "@/components/streaming/ContentWarningModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchSeriesById, groupEpisodesBySeasons, seriesThumbnail, episodeThumbnail, formatDuration, type BackendSeries, type BackendEpisode } from "@/lib/series";
import { assetUrl } from "@/services/api";
import { Loader2, Play, Calendar, Globe, Tv, ArrowLeft, Clock } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function SeriesDetailPage() {
  return (
    <Protected>
      <SeriesDetailInner />
    </Protected>
  );
}

function SeriesDetailInner() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const [series, setSeries] = useState<BackendSeries | null | undefined>(undefined);
  const [activeSeason, setActiveSeason] = useState(1);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingEpisode, setPendingEpisode] = useState<BackendEpisode | null>(null);

  useEffect(() => {
    if (!seriesId) return;
    fetchSeriesById(seriesId).then(setSeries).catch(() => setSeries(null));
  }, [seriesId]);

  if (series === undefined) {
    return (
      <MainLayout>
        <div className="flex justify-center py-24"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      </MainLayout>
    );
  }

  if (!series) {
    return (
      <MainLayout>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-bold">Series not found</h1>
          <Button className="mt-4" asChild><Link to="/browse">Back to browse</Link></Button>
        </div>
      </MainLayout>
    );
  }

  const publishedEpisodes = (series.episodes ?? []).filter((e) => e.status === "published");
  const seasonMap = groupEpisodesBySeasons(publishedEpisodes);
  const seasons = Object.keys(seasonMap).map(Number).sort((a, b) => a - b);
  const year = series.release_date ? new Date(series.release_date).getFullYear() : null;
  const currentSeasonEps = (seasonMap[activeSeason] ?? []).sort((a, b) => a.episode_number - b.episode_number);
  const firstEp = publishedEpisodes[0] ?? null;

  function handlePlayEpisode(ep: BackendEpisode) {
    if ((series!.is_age_restricted || (series!.warning_flags_json?.length ?? 0) > 0) && user?.age_verified) {
      setPendingEpisode(ep);
      setShowWarning(true);
      return;
    }
    navigate(`/watch/series/${series!.id}/episode/${ep.id}`);
  }

  return (
    <MainLayout flush>
      {/* Content warning */}
      {showWarning && pendingEpisode && (
        <ContentWarningModal
          open
          title={series.title}
          contentRating={series.content_rating}
          warningFlags={series.warning_flags_json}
          minimumAge={series.minimum_age}
          onConfirm={() => { setShowWarning(false); navigate(`/watch/series/${series.id}/episode/${pendingEpisode.id}`); }}
          onCancel={() => { setShowWarning(false); setPendingEpisode(null); }}
        />
      )}

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative bg-[#0a0a0f] overflow-hidden">
        {/* Backdrop blur */}
        {series.thumbnail_url && (
          <>
            <img
              src={assetUrl(series.thumbnail_url)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105 blur-sm"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,10,15,0.98) 0%, rgba(10,10,15,0.75) 60%, rgba(10,10,15,0.55) 100%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,15,1) 0%, transparent 40%)" }} />
          </>
        )}

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-8 transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" /> Back
          </button>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Poster */}
            <div className="shrink-0 w-36 sm:w-44 lg:w-52">
              <img
                src={seriesThumbnail(series)}
                alt={series.title}
                className="w-full rounded-xl object-cover shadow-2xl ring-1 ring-white/10"
                style={{ aspectRatio: "2/3" }}
              />
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
              {/* Chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold tracking-wide">SERIES</Badge>
                {series.is_featured && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">⭐ Featured</Badge>}
                {series.content_rating && <AgeRatingBadge rating={series.content_rating} />}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">{series.title}</h1>

              {/* Stats row */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/50">
                {year && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 shrink-0" />{year}
                  </span>
                )}
                {series.language && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="size-3.5 shrink-0" />{series.language}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Tv className="size-3.5 shrink-0" />
                  {series.total_seasons} Season{series.total_seasons !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Play className="size-3.5 shrink-0" />
                  {publishedEpisodes.length} Episode{publishedEpisodes.length !== 1 ? "s" : ""}
                </span>
              </div>

              {series.description && (
                <p className="mt-4 text-white/65 leading-relaxed max-w-2xl text-sm sm:text-[15px] line-clamp-3">
                  {series.description}
                </p>
              )}

              {/* CTA */}
              {firstEp && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="gap-2 font-semibold px-6"
                    onClick={() => handlePlayEpisode(firstEp)}
                  >
                    <Play className="size-4 fill-current" />
                    Play S1 E1
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 text-white border-white/20 hover:bg-white/10 hover:text-white bg-transparent"
                    onClick={() => document.getElementById("episodes-section")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Browse Episodes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Episodes Section ─────────────────────────────────────────────────── */}
      <div id="episodes-section" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {seasons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Tv className="size-12 mb-4 opacity-20" />
            <p className="text-base font-medium">No episodes available yet.</p>
            <p className="text-sm mt-1 opacity-60">Check back soon for new content.</p>
          </div>
        ) : (
          <>
            {/* Season Selector */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-foreground">Episodes</h2>
              {seasons.length > 1 && (
                <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg p-1">
                  {seasons.map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveSeason(s)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        activeSeason === s
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      Season {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Season summary line */}
            <p className="text-sm text-muted-foreground mb-5">
              Season {activeSeason} · {currentSeasonEps.length} episode{currentSeasonEps.length !== 1 ? "s" : ""}
            </p>

            {/* Episode list */}
            <div className="space-y-1">
              {currentSeasonEps.map((ep, idx) => (
                <EpisodeCard
                  key={ep.id}
                  ep={ep}
                  index={idx + 1}
                  onPlay={() => handlePlayEpisode(ep)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function EpisodeCard({ ep, index, onPlay }: { ep: BackendEpisode; index: number; onPlay: () => void }) {
  const [imgError, setImgError] = useState(false);
  const isNew = ep.release_date
    ? new Date(ep.release_date) > new Date(Date.now() - 14 * 24 * 3600 * 1000)
    : false;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => e.key === "Enter" && onPlay()}
      className="group flex items-start gap-4 rounded-xl px-4 py-4 hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Episode Number */}
      <div className="shrink-0 w-7 text-center mt-1 hidden sm:block">
        <span className="text-lg font-bold text-muted-foreground/50 group-hover:text-muted-foreground transition-colors tabular-nums">
          {index}
        </span>
      </div>

      {/* Thumbnail */}
      <div
        className="relative shrink-0 rounded-lg overflow-hidden bg-secondary/60"
        style={{ width: 200, aspectRatio: "16/9" }}
      >
        {!imgError ? (
          <img
            src={episodeThumbnail(ep)}
            alt={ep.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Tv className="size-6 text-muted-foreground/40" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="size-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
            <Play className="size-5 fill-white text-white ml-0.5" />
          </div>
        </div>
        {/* Duration badge */}
        {ep.duration && (
          <div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white/90 leading-none">
            {formatDuration(ep.duration)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                E{ep.episode_number}
              </span>
              {isNew && (
                <span className="inline-flex items-center rounded-full bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  New
                </span>
              )}
            </div>
            <h3 className="font-semibold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
              {ep.title}
            </h3>
          </div>
          {/* Duration for small screens */}
          {ep.duration && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0 mt-0.5">
              <Clock className="size-3" />
              {formatDuration(ep.duration)}
            </span>
          )}
        </div>
        {ep.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {ep.description}
          </p>
        )}
        {ep.release_date && (
          <p className="mt-2 text-xs text-muted-foreground/60">
            {new Date(ep.release_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
}
