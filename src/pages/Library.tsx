import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { TitleCard } from "@/components/streaming/TitleCard";
import type { Title, Category } from "@/lib/mock-data";
import { fetchMovies } from "@/lib/movies";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SearchX, SlidersHorizontal, Loader2, Film } from "lucide-react";

const FILTERS: ("All" | Category)[] = ["All", "Trending", "New Releases", "Most Watched", "Recommended"];
const PAGE = 12;

export default function Library() {
  const [allTitles, setAllTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [visible, setVisible] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMovies({ status: "published", limit: 200 })
      .then(setAllTitles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTitles.filter((t) => {
      const matchQ = !q || t.name.toLowerCase().includes(q) || t.genres.some((g: string) => g.toLowerCase().includes(q)) || t.director?.toLowerCase().includes(q) || t.cast?.some((c: string) => c.toLowerCase().includes(q));
      const matchF = filter === "All" || t.category === filter;
      return matchQ && matchF;
    });
  }, [allTitles, query, filter]);

  useEffect(() => setVisible(PAGE), [query, filter]);

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
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="inline-flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Film className="size-4" />
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">Library</h1>
            </div>
            <p className="text-sm text-muted-foreground pl-10">
              {loading ? "Loading catalog…" : `${allTitles.length} titles · Search by title, genre, director or cast`}
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-sm w-full sm:w-auto">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, genres, cast…"
              className="pl-10 pr-4 h-10 bg-card/70 border-border/60 focus:border-primary/50 rounded-xl"
              aria-label="Search catalog"
            />
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
            <SlidersHorizontal className="size-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">Filter</span>
          </div>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-glow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="size-8 animate-spin text-primary/60" />
            <p className="text-sm text-muted-foreground">Loading your library…</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-28 text-center bg-card/30">
            <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
              <SearchX className="size-7 text-muted-foreground/50" />
            </div>
            <h2 className="text-lg font-bold">No results found</h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
              Try adjusting your search or removing filters to see more titles.
            </p>
            <Button
              variant="secondary"
              className="mt-5 rounded-full px-6"
              onClick={() => { setQuery(""); setFilter("All"); }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-medium">
              <span className="text-foreground font-bold">{results.length}</span> results
              {query && <span className="ml-1">for &ldquo;{query}&rdquo;</span>}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {shown.map((t) => (
                <TitleCard key={t.id} title={t} fullWidth />
              ))}
            </div>
            {visible < results.length && (
              <div ref={sentinel} className="flex justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
