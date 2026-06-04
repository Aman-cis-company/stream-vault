import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Hero } from "@/components/streaming/Hero";
import { TitleRow } from "@/components/streaming/TitleRow";
import { fetchMovies } from "@/lib/movies";
import type { Title } from "@/lib/mock-data";
import { Loader2 } from "lucide-react";

export default function Browse() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies({ status: "published", limit: 100 })
      .then(setTitles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout flush>
      <Hero />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <TitleRow heading="All Titles" titles={titles} />
        )}
      </div>
    </MainLayout>
  );
}
