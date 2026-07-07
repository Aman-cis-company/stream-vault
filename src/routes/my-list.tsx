import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Protected } from "@/components/streaming/Protected";
import { fetchMyList, mapMovieToTitle, type ListItem } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Loader2, BookmarkX } from "lucide-react";
import { TitleCard } from "@/components/streaming/TitleCard";
import { SeriesCard } from "@/components/streaming/TitleRow";
import type { BackendSeries } from "@/lib/series";

function MyListInner() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyList()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-5 text-center">
        <span className="inline-flex size-20 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
          <BookmarkX className="size-9 text-primary" />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold">Your list is empty</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Browse movies and series, then hit <strong>My List</strong> to save them here.
          </p>
        </div>
        <Button asChild>
          <Link to="/browse">Browse Content</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map(({ interaction, detail }) => {
        if (interaction.content_type === "movie") {
          const title = mapMovieToTitle(detail as any);
          return (
            <div key={`movie-${detail.id}`} className="w-full">
              <TitleCard title={title} />
            </div>
          );
        } else {
          return (
            <div key={`series-${detail.id}`} className="w-full">
              <SeriesCard s={detail as BackendSeries} />
            </div>
          );
        }
      })}
    </div>
  );
}

export default function MyList() {
  return (
    <Protected>
      <MainLayout>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My List</h1>
            <p className="mt-1 text-sm text-muted-foreground">Movies and series you've saved</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/browse">+ Add more</Link>
          </Button>
        </div>
        <MyListInner />
      </MainLayout>
    </Protected>
  );
}
