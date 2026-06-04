import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Hero } from "@/components/streaming/Hero";
import { TitleRow } from "@/components/streaming/TitleRow";
import { AgeRatingBadge } from "@/components/streaming/AgeRatingBadge";
import { apiClient } from "@/services/api";
import { mapMovieToTitle } from "@/lib/movies";
import { fetchSeriesList, seriesThumbnail, type BackendSeries } from "@/lib/series";
import type { Title } from "@/lib/mock-data";
import type { BackendMovie } from "@/store/slices/moviesSlice";
import type { Category } from "@/store/slices/categoriesSlice";
import { Loader2, Play, Tv } from "lucide-react";

// ── Series Card ───────────────────────────────────────────────────────────────

function SeriesCard({ s }: { s: BackendSeries }) {
  return (
    <Link to={`/series/${s.id}`} className="group relative shrink-0 overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-200 hover:ring-primary/50 hover:shadow-lg" style={{ width: "clamp(160px, 18vw, 220px)" }}>
      <div className="relative" style={{ aspectRatio: "2/3" }}>
        <img src={seriesThumbnail(s)} alt={s.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/s${s.id}/220/330`; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="size-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
            <Play className="size-5 fill-white text-white ml-0.5" />
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-semibold text-sky-300 border border-sky-500/25">
            <Tv className="size-2.5" /> SERIES
          </span>
          {s.content_rating && <AgeRatingBadge rating={s.content_rating} className="text-[9px]" />}
        </div>
        <div className="absolute bottom-0 inset-x-0 p-2">
          <p className="text-xs font-semibold text-white leading-tight line-clamp-2 drop-shadow">{s.title}</p>
          <p className="text-[10px] text-white/60 mt-0.5">{s.total_seasons} Season{s.total_seasons !== 1 ? "s" : ""}</p>
        </div>
      </div>
    </Link>
  );
}

function SeriesRow({ heading, seriesList }: { heading: string; seriesList: BackendSeries[] }) {
  if (!seriesList.length) return null;
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{heading}</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {seriesList.map((s) => <SeriesCard key={s.id} s={s} />)}
      </div>
    </div>
  );
}

// ── Main Browse ───────────────────────────────────────────────────────────────

export default function Browse() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [moviesByCategory, setMoviesByCategory] = useState<Record<number, Title[]>>({});
  const [extras, setExtras] = useState<Title[]>([]);
  const [seriesList, setSeriesList] = useState<BackendSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
          if (m.category_id) { if (!byCat[m.category_id]) byCat[m.category_id] = []; byCat[m.category_id].push(mapped); }
          else rest.push(mapped);
        });
        setMoviesByCategory(byCat);
        setExtras(rest);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hasContent = categories.some((c) => (moviesByCategory[c.id]?.length ?? 0) > 0) || extras.length > 0 || seriesList.length > 0;

  return (
    <MainLayout flush>
      <Hero />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
        ) : !hasContent ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
            <p className="text-lg font-semibold">No content available yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back soon — new titles are being added.</p>
          </div>
        ) : (
          <>
            {/* Web Series row */}
            {seriesList.length > 0 && <SeriesRow heading="Web Series" seriesList={seriesList} />}

            {/* Movies by category */}
            {categories.map((cat) => {
              const titles = moviesByCategory[cat.id] ?? [];
              if (!titles.length) return null;
              return <TitleRow key={cat.id} heading={cat.name} titles={titles} />;
            })}
            {extras.length > 0 && <TitleRow heading="Other Titles" titles={extras} />}
          </>
        )}
      </div>
    </MainLayout>
  );
}
