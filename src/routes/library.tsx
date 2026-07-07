import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { TitleCard } from "@/components/streaming/TitleCard";
import { SeriesCard } from "@/components/streaming/TitleRow";
import { apiClient } from "@/services/api";
import { mapMovieToTitle } from "@/lib/movies";
import { fetchSeriesList } from "@/lib/series";
import { DUMMY_MOVIES, DUMMY_SERIES } from "@/lib/mock-data";
import type { Title } from "@/lib/mock-data";
import type { BackendMovie } from "@/store/slices/moviesSlice";
import type { Category } from "@/store/slices/categoriesSlice";
import type { BackendSeries } from "@/lib/series";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SearchX, Loader2, Tv2 } from "lucide-react";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";

const PAGE = 12;

// ── Library Page ─────────────────────────────────────────────────────────────

type ContentType = "movies" | "series";

export default function Library() {
  const [allTitles, setAllTitles] = useState<Title[]>([]);
  const [allSeries, setAllSeries] = useState<BackendSeries[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const categoryId = useParams<{ categoryId: string }>().categoryId;
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState<ContentType>("movies");

  const [searchParams] = useSearchParams();
  const qParam = searchParams.get("q");
  const langParam = searchParams.get("language");
  const genreParam = searchParams.get("genre");

  const [query, setQuery] = useState(qParam || "");

  useEffect(() => {
    setQuery(qParam || "");
  }, [qParam]);

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
      const cats = catRes.data.data.categories ?? [];
      setCategories(cats);
      
      const movs = (movRes.data.data.movies as BackendMovie[]).map(mapMovieToTitle);
      const finalMovies = [...movs];
      DUMMY_MOVIES.forEach((dm) => {
        if (!movs.some(m => m.name === dm.name)) {
          finalMovies.push(dm);
        }
      });
      setAllTitles(finalMovies);

      const sers = Array.isArray(serRes) ? serRes : [];
      const finalSeries = [...sers];
      DUMMY_SERIES.forEach((ds) => {
        if (!sers.some(s => s.title === ds.title)) {
          finalSeries.push(ds);
        }
      });
      setAllSeries(finalSeries);
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
    const q = (query || qParam || "").trim().toLowerCase();
    const targetLang = (langParam || "").trim().toLowerCase();
    const targetGenre = (genreParam || "").trim().toLowerCase();

    return allTitles.filter((t) => {
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.genres.some((g) => g.toLowerCase().includes(q));

      const matchLang =
        !targetLang ||
        t.language?.toLowerCase() === targetLang ||
        t.language?.toLowerCase().startsWith(targetLang);

      const matchGenre =
        !targetGenre ||
        t.genres.some((g) => g.toLowerCase() === targetGenre);

      const targetCatName = categories.find((c) => c.id === filter)?.name;
      const matchF =
        filter === "all" ||
        t.category === targetCatName ||
        t.categories?.some((c) => c.id === filter || c.name === targetCatName);

      return matchQ && matchLang && matchGenre && matchF;
    });
  }, [query, qParam, langParam, genreParam, filter, allTitles, categories]);

  const seriesResults = useMemo(() => {
    const q = (query || qParam || "").trim().toLowerCase();
    const targetLang = (langParam || "").trim().toLowerCase();

    return allSeries.filter((s) => {
      const matchQ = !q || s.title.toLowerCase().includes(q);
      const matchLang =
        !targetLang ||
        s.language?.toLowerCase() === targetLang ||
        s.language?.toLowerCase().startsWith(targetLang);
      return matchQ && matchLang;
    });
  }, [query, qParam, langParam, allSeries]);

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
          <p className="mt-1 text-muted-foreground">
            {langParam || genreParam || qParam ? (
              <span className="flex items-center gap-1.5 flex-wrap">
                <span>Showing results for</span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                  {langParam || genreParam || qParam}
                </span>
                <Link to="/library" className="text-sm text-primary hover:underline font-medium">
                  • Clear filter
                </Link>
              </span>
            ) : (
              "Explore the full catalog."
            )}
          </p>
        </div>

        {/* Content type toggle */}
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <button
            onClick={() => setContentType("movies")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              contentType === "movies"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                    <SeriesCard key={s.id} s={s} />
                  ))}
            </div>
            {visible < results.length && <div ref={sentinel} className="h-10" />}
          </>
        )}
      </div>
    </MainLayout>
  );
}
