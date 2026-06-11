import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Link, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { TitleCard } from "@/components/streaming/TitleCard";
import { apiClient } from "@/services/api";
import { mapMovieToTitle } from "@/lib/movies";
import { fetchSeriesList, seriesThumbnail } from "@/lib/series";
import type { Title } from "@/lib/mock-data";
import type { BackendMovie } from "@/store/slices/moviesSlice";
import type { Category } from "@/store/slices/categoriesSlice";
import type { BackendSeries } from "@/lib/series";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SearchX, Loader2, Play, Tv2 } from "lucide-react";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";
const PAGE = 12;

// ── Series Card ──────────────────────────────────────────────────────────────

function SeriesCard({ series }: { series: BackendSeries }) {
  const [imgError, setImgError] = useState(false);
  const thumb = imgError
    ? `https://picsum.photos/seed/series-${series.id}/342/513`
    : seriesThumbnail(series);

  const seasonCount = series.total_seasons ?? 1;
  const epCount = series.episodes?.length ?? null;

  return (
    <Link
      to={`/series/${series.id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/8 hover:border-white/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-black/30">
        <img
          src={thumb}
          alt={series.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="size-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
            <Play className="size-5 fill-white text-white ml-0.5" />
          </div>
        </div>
        {/* Series badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/20 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/25 tracking-wide uppercase">
            <Tv2 className="size-2.5" />
            Series
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {series.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-white/40 flex-wrap">
          <span>{seasonCount} {seasonCount === 1 ? "Season" : "Seasons"}</span>
          {epCount !== null && epCount > 0 && (
            <>
              <span className="size-0.5 rounded-full bg-white/25" />
              <span>{epCount} Episodes</span>
            </>
          )}
          {series.is_featured && (
            <>
              <span className="size-0.5 rounded-full bg-white/25" />
              <span className="text-amber-400">Featured</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Library Page ─────────────────────────────────────────────────────────────

type ContentType = "movies" | "series";

export default function Library() {
  const [allTitles, setAllTitles] = useState<Title[]>([]);
  const [allSeries, setAllSeries] = useState<BackendSeries[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const categoryId = useParams<{ categoryId: string }>().categoryId;
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState<ContentType>("movies");
  const [query, setQuery] = useState("");
  const initialFilter =
    categoryId && !isNaN(Number(categoryId))
      ? Number(categoryId)
      : "all";
  const [filter, setFilter] = useState<number | "all" | string>(initialFilter);
  const [visible, setVisible] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [catRes, movRes, serRes] = await Promise.all([
        apiClient.get("/categories?status=active&limit=50"),
        apiClient.get("/movies?status=published&limit=200"),
        fetchSeriesList({ status: "published", limit: 200 }).catch(() => [] as BackendSeries[]),
      ]);
      setCategories(catRes.data.data.categories ?? []);
      setAllTitles(
        (movRes.data.data.movies as BackendMovie[]).map(mapMovieToTitle)
      );
      setAllSeries(Array.isArray(serRes) ? serRes : []);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time: re-fetch when any movie or series changes
  useSocketEvent(SOCKET_EVENTS.MOVIE_CREATED, load);
  useSocketEvent(SOCKET_EVENTS.MOVIE_UPDATED, load);
  useSocketEvent(SOCKET_EVENTS.MOVIE_DELETED, load);
  useSocketEvent(SOCKET_EVENTS.SERIES_CREATED, load);
  useSocketEvent(SOCKET_EVENTS.SERIES_UPDATED, load);
  useSocketEvent(SOCKET_EVENTS.SERIES_DELETED, load);
  useSocketEvent(SOCKET_EVENTS.CONTENT_PUBLISHED, load);
  useSocketEvent(SOCKET_EVENTS.CONTENT_UNPUBLISHED, load);

  const movieResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTitles.filter((t) => {
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.genres.some((g) => g.toLowerCase().includes(q));
      const matchF =
        filter === "all" ||
        t.category === categories.find((c) => c.id === filter)?.name;
      return matchQ && matchF;
    });
  }, [query, filter, allTitles, categories]);

  const seriesResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allSeries.filter((s) => !q || s.title.toLowerCase().includes(q));
  }, [query, allSeries]);

  const results = contentType === "movies" ? movieResults : seriesResults;

  useEffect(() => setVisible(PAGE), [query, filter, contentType]);

  const loadMore = useCallback(() => {
    setVisible((v) => Math.min(v + PAGE, results.length));
  }, [results.length]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const shown = results.slice(0, visible);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="mt-1 text-muted-foreground">Explore the full catalog.</p>
        </div>

        {/* Content type toggle */}
        <div className="flex items-center gap-2 border-b border-white/8 pb-4">
          <button
            onClick={() => setContentType("movies")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              contentType === "movies"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-white/50 hover:text-white hover:bg-white/8"
            }`}
          >
            Movies
            {allTitles.length > 0 && (
              <span className="ml-2 text-[10px] opacity-60">({allTitles.length})</span>
            )}
          </button>
          <button
            onClick={() => setContentType("series")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              contentType === "series"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-white/50 hover:text-white hover:bg-white/8"
            }`}
          >
            <Tv2 className="size-3.5" />
            Web Series
            {allSeries.length > 0 && (
              <span className="text-[10px] opacity-60">({allSeries.length})</span>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={contentType === "movies" ? "Search movies…" : "Search series…"}
              className="pl-9"
              aria-label="Search catalog"
            />
          </div>
          {contentType === "movies" && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "secondary"}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={filter === c.id ? "default" : "secondary"}
                  onClick={() => setFilter(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <SearchX className="size-10 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">No results found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {results.length === 0
                ? contentType === "series"
                  ? "No series available yet."
                  : "No titles available yet."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-8">
              {contentType === "movies"
                ? (shown as Title[]).map((t) => (
                    <TitleCard key={t.id} title={t} fullWidth />
                  ))
                : (shown as BackendSeries[]).map((s) => (
                    <SeriesCard key={s.id} series={s} />
                  ))}
            </div>
            {visible < results.length && <div ref={sentinel} className="h-10" />}
          </>
        )}
      </div>
    </MainLayout>
  );
}
