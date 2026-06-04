import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { TitleCard } from "@/components/streaming/TitleCard";
import { apiClient } from "@/services/api";
import { mapMovieToTitle } from "@/lib/movies";
import type { Title } from "@/lib/mock-data";
import type { BackendMovie } from "@/store/slices/moviesSlice";
import type { Category } from "@/store/slices/categoriesSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SearchX, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

const PAGE = 12;

export default function Library() {
  const [allTitles, setAllTitles] = useState<Title[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const categoryId = useParams<{ categoryId: string }>().categoryId;
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const initialFilter =
  categoryId && !isNaN(Number(categoryId))
    ? Number(categoryId)
    : "all";
  const [filter, setFilter] = useState<number | "all" | string>(initialFilter);
  const [visible, setVisible] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [catRes, movRes] = await Promise.all([
          apiClient.get("/categories?status=active&limit=50"),
          apiClient.get("/movies?status=published&limit=200"),
        ]);
        setCategories(catRes.data.data.categories ?? []);
        setAllTitles(
          (movRes.data.data.movies as BackendMovie[]).map(mapMovieToTitle)
        );
      } catch {
        // empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTitles.filter((t) => {
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.genres.some((g) => g.toLowerCase().includes(q));
      const matchF =
        filter === "all" ||
        // compare by numeric category id stored in title.category (we stored category name)
        // re-filter by fetching, or use category name match
        t.category === categories.find((c) => c.id === filter)?.name;
      return matchQ && matchF;
    });
  }, [query, filter, allTitles, categories]);

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
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="mt-1 text-muted-foreground">Explore the full catalog.</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles…"
              className="pl-9"
              aria-label="Search catalog"
            />
          </div>
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
              {allTitles.length === 0
                ? "No titles available yet."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <>
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
