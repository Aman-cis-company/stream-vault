import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Protected } from "@/components/streaming/Protected";
import { AgeRatingBadge } from "@/components/streaming/AgeRatingBadge";
import { ContentWarningModal } from "@/components/streaming/ContentWarningModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchSeriesById, groupEpisodesBySeasons, seriesThumbnail, episodeThumbnail, formatDuration, type BackendSeries, type BackendEpisode } from "@/lib/series";
import { assetUrl } from "@/services/api";
import { Loader2, Play, Star, Calendar, Globe, Tv, ArrowLeft } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("1");
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

      {/* Hero banner */}
      <div className="relative min-h-[420px] bg-[#0a0a0f] overflow-hidden">
        {series.thumbnail_url && (
          <>
            <img src={assetUrl(series.thumbnail_url)} alt={series.title} className="absolute inset-0 w-full h-full object-cover opacity-25" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,15,0.97) 40%, rgba(10,10,15,0.6) 100%)" }} />
          </>
        )}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 flex flex-col sm:flex-row gap-8 items-start">
          {/* Poster */}
          <img
            src={seriesThumbnail(series)}
            alt={series.title}
            className="w-40 sm:w-52 rounded-xl object-cover shadow-2xl ring-1 ring-white/10 shrink-0"
          />
          {/* Info */}
          <div className="flex-1 min-w-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="size-4" /> Back
            </button>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">SERIES</Badge>
              {series.is_featured && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">⭐ Featured</Badge>}
              {series.content_rating && <AgeRatingBadge rating={series.content_rating} />}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{series.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/50">
              {year && <span className="flex items-center gap-1"><Calendar className="size-3.5" />{year}</span>}
              {series.language && <span className="flex items-center gap-1"><Globe className="size-3.5" />{series.language}</span>}
              <span className="flex items-center gap-1"><Tv className="size-3.5" />{series.total_seasons} Season{series.total_seasons !== 1 ? "s" : ""}</span>
              <span>{publishedEpisodes.length} Episodes</span>
            </div>
            {series.description && (
              <p className="mt-4 text-white/70 leading-relaxed max-w-2xl text-sm sm:text-base line-clamp-4">{series.description}</p>
            )}
            {publishedEpisodes.length > 0 && (
              <Button className="mt-6 gap-2" size="lg" onClick={() => handlePlayEpisode(publishedEpisodes[0])}>
                <Play className="size-4 fill-current" /> Play S1 E1
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Episodes by season */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {seasons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No episodes available yet.</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              {seasons.map((s) => (
                <TabsTrigger key={s} value={String(s)}>Season {s}</TabsTrigger>
              ))}
            </TabsList>
            {seasons.map((s) => (
              <TabsContent key={s} value={String(s)}>
                <div className="space-y-3">
                  {(seasonMap[s] ?? []).map((ep) => (
                    <EpisodeCard key={ep.id} ep={ep} onPlay={() => handlePlayEpisode(ep)} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}

function EpisodeCard({ ep, onPlay }: { ep: BackendEpisode; onPlay: () => void }) {
  return (
    <div
      className="group flex gap-4 rounded-xl border border-border bg-card p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
      onClick={onPlay}
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 rounded-lg overflow-hidden bg-secondary" style={{ width: 180, aspectRatio: "16/9" }}>
        <img src={episodeThumbnail(ep)} alt={ep.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="size-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Play className="size-5 fill-white text-white ml-0.5" />
          </div>
        </div>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">E{ep.episode_number}</p>
            <h3 className="font-semibold text-base leading-tight mt-0.5 truncate">{ep.title}</h3>
          </div>
          {ep.duration && <span className="text-xs text-muted-foreground shrink-0 mt-1">{formatDuration(ep.duration)}</span>}
        </div>
        {ep.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{ep.description}</p>}
        {ep.release_date && <p className="mt-1.5 text-xs text-muted-foreground">{new Date(ep.release_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
      </div>
    </div>
  );
}
