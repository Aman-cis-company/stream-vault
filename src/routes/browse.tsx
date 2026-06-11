import { useEffect, useState, useCallback } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Hero } from "@/components/streaming/Hero";
import { ContentRow, SeriesContentRow } from "@/components/streaming/TitleRow";
import { apiClient } from "@/services/api";
import { mapMovieToTitle } from "@/lib/movies";
import { fetchSeriesList } from "@/lib/series";
import type { Title } from "@/lib/mock-data";
import type { BackendMovie } from "@/store/slices/moviesSlice";
import type { BackendSeries } from "@/lib/series";
import type { Category } from "@/store/slices/categoriesSlice";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";
import { Loader2 } from "lucide-react";

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-28 text-center mx-4 sm:mx-10 lg:mx-14">
      <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Loader2 className="size-7 text-white/20" />
      </div>
      <p className="text-lg font-semibold text-white/60">No content available yet</p>
      <p className="mt-1 text-sm text-white/30">Check back soon — new titles are being added.</p>
    </div>
  );
}

// ── Skeleton rows (while loading) ─────────────────────────────────────────────

function SkeletonRows() {
  const LABELS = ["Trending Now", "Web Series", "Action", "Drama", "Comedy"];
  return (
    <div className="space-y-2 pt-6">
      {LABELS.map((label) => (
        <ContentRow key={label} heading={label} titles={[]} loading />
      ))}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="relative mx-4 sm:mx-10 lg:mx-14 my-1">
      <div className="h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
    </div>
  );
}

// ── Browse page ───────────────────────────────────────────────────────────────

export default function Browse() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [moviesByCategory, setMoviesByCategory] = useState<Record<number, Title[]>>({});
  const [extras, setExtras] = useState<Title[]>([]);
  const [seriesList, setSeriesList] = useState<BackendSeries[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [catRes, movRes, seriesData] = await Promise.all([
        apiClient.get("/categories?status=active&limit=50"),
        apiClient.get("/movies?status=published&limit=100"),
        fetchSeriesList({ status: "published", limit: 50 }),
      ]);

      const cats: Category[] = catRes.data.data.categories ?? [];
      const movies: BackendMovie[] = movRes.data.data.movies ?? [];
      setCategories(cats);
      setSeriesList(seriesData);

      const byCat: Record<number, Title[]> = {};
      const rest: Title[] = [];
      movies.forEach((m) => {
        const mapped = mapMovieToTitle(m);
        if (m.category_id) {
          if (!byCat[m.category_id]) byCat[m.category_id] = [];
          byCat[m.category_id].push(mapped);
        } else {
          rest.push(mapped);
        }
      });
      setMoviesByCategory(byCat);
      setExtras(rest);
    } catch {
      // silent — empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time: re-fetch when content changes in admin
  useSocketEvent(SOCKET_EVENTS.MOVIE_CREATED, load);
  useSocketEvent(SOCKET_EVENTS.MOVIE_UPDATED, load);
  useSocketEvent(SOCKET_EVENTS.MOVIE_DELETED, load);
  useSocketEvent(SOCKET_EVENTS.SERIES_CREATED, load);
  useSocketEvent(SOCKET_EVENTS.SERIES_UPDATED, load);
  useSocketEvent(SOCKET_EVENTS.SERIES_DELETED, load);
  useSocketEvent(SOCKET_EVENTS.CONTENT_PUBLISHED, load);
  useSocketEvent(SOCKET_EVENTS.CONTENT_UNPUBLISHED, load);

  // Derived: trending/new-release rows from all movies
  const allMovies = Object.values(moviesByCategory).flat().concat(extras);
  const trendingMovies = allMovies.filter((t) => t.trending);
  const newReleaseMovies = allMovies.filter((t) => t.newRelease);

  const hasCategoryContent = categories.some(
    (c) => (moviesByCategory[c.id]?.length ?? 0) > 0
  );
  const hasContent = hasCategoryContent || extras.length > 0 || seriesList.length > 0;

  return (
    <MainLayout flush>
      {/* ── Hero ── */}
      <Hero />

      {/* ── Content area — full viewport width ── */}
      <div className="relative w-full bg-background pb-20">

        {/* Top gradient bleed from Hero into content */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-12 z-10"
          style={{
            background:
              "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
          }}
        />

        {loading ? (
          <SkeletonRows />
        ) : !hasContent ? (
          <div className="pt-12">
            <EmptyState />
          </div>
        ) : (
          <div className="pt-6 space-y-1">

            {/* ── Trending Now ── */}
            {trendingMovies.length > 0 && (
              <>
                <ContentRow
                  heading="Trending Now"
                  titles={trendingMovies}
                  badge="trending"
                  seeAllHref="/library"
                />
                <SectionDivider />
              </>
            )}

            {/* ── Web Series ── */}
            {seriesList.length > 0 && (
              <>
                <SeriesContentRow
                  heading="Web Series"
                  series={seriesList}
                  badge="series"
                  seeAllHref="/library"
                />
                <SectionDivider />
              </>
            )}

            {/* ── New Releases ── */}
            {newReleaseMovies.length > 0 && (
              <>
                <ContentRow
                  heading="New Releases"
                  titles={newReleaseMovies}
                  badge="new"
                  seeAllHref="/library"
                />
                <SectionDivider />
              </>
            )}

            {/* ── Movies by category ── */}
            {categories.map((cat, idx) => {
              const titles = moviesByCategory[cat.id] ?? [];
              if (!titles.length) return null;
              return (
                <div key={cat.id}>
                  <ContentRow
                    heading={cat.name}
                    titles={titles}
                    seeAllHref="/library"
                  />
                  {idx < categories.length - 1 && <SectionDivider />}
                </div>
              );
            })}

            {/* ── Uncategorised ── */}
            {extras.length > 0 && (
              <>
                <SectionDivider />
                <ContentRow
                  heading="More Titles"
                  titles={extras}
                  seeAllHref="/library"
                />
              </>
            )}

            {/* Bottom breathing room */}
            <div className="h-8" />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
