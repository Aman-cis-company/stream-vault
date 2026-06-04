import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Hero } from "@/components/streaming/Hero";
import { TitleRow } from "@/components/streaming/TitleRow";
import { apiClient } from "@/services/api";
import { mapMovieToTitle } from "@/lib/movies";
import type { Title } from "@/lib/mock-data";
import type { BackendMovie } from "@/store/slices/moviesSlice";
import type { Category } from "@/store/slices/categoriesSlice";
import { Loader2 } from "lucide-react";

export default function Browse() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [moviesByCategory, setMoviesByCategory] = useState<Record<number, Title[]>>({});
  const [extras, setExtras] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [catRes, movRes] = await Promise.all([
          apiClient.get("/categories?status=active&limit=50"),
          apiClient.get("/movies?status=published&limit=100"),
        ]);

        const cats: Category[] = catRes.data.data.categories ?? [];
        const movies: BackendMovie[] = movRes.data.data.movies ?? [];

        setCategories(cats);

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
        // show empty state on API failure
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hasContent =
    categories.some((c) => (moviesByCategory[c.id]?.length ?? 0) > 0) ||
    extras.length > 0;

  return (
    <MainLayout flush>
      <Hero />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : !hasContent ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
            <p className="text-lg font-semibold">No content available yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back soon — new titles are being added.
            </p>
          </div>
        ) : (
          <>
            {categories.map((cat) => {
              const titles = moviesByCategory[cat.id] ?? [];
              if (!titles.length) return null;
              return <TitleRow key={cat.id} heading={cat.name} titles={titles} />;
            })}
            {extras.length > 0 && (
              <TitleRow heading="Other Titles" titles={extras} />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
