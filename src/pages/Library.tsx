import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { TitleCard } from "@/components/streaming/TitleCard";
import type { Title, Category } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SearchX, SlidersHorizontal } from "lucide-react";

const FILTERS: ("All" | Category)[] = ["All", "Trending", "New Releases", "Most Watched", "Recommended"];
const PAGE = 12;

export default function Library() {
  const [allTitles, setAllTitles] = useState<Title[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [visible, setVisible] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Library</h1>
          <p className="mt-1 text-muted-foreground">
            {allTitles.length} titles · Search by title, genre, director or cast
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, genres, directors, cast…"
              className="pl-9"
              aria-label="Search catalog"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="size-4 text-muted-foreground shrink-0" />
            {FILTERS.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "secondary"}
                onClick={() => setFilter(f)}
                className="text-xs"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
            <SearchX className="size-12 text-muted-foreground/50" />
            <h2 className="mt-4 font-semibold">No results found</h2>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>
            <Button variant="secondary" className="mt-4" onClick={() => { setQuery(""); setFilter("All"); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{results.length} results</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {shown.map((t) => (
                <TitleCard key={t.id} title={t} fullWidth />
              ))}
            </div>
            {visible < results.length && <div ref={sentinel} className="h-10" />}
          </>
        )}
      </div>
    </MainLayout>
  );
}
