import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Protected } from "@/components/streaming/Protected";
import { fetchMyList, type ListItem } from "@/lib/movies";
import { assetUrl } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Tv2, BookmarkX, Film } from "lucide-react";

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
        const href =
          interaction.content_type === "movie"
            ? `/watch/${detail.id}`
            : `/series/${detail.id}`;
        const thumb = detail.thumbnail_url
          ? assetUrl(detail.thumbnail_url)
          : `https://picsum.photos/seed/${detail.id}/342/513`;

        return (
          <Link
            key={`${interaction.content_type}-${detail.id}`}
            to={href}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:border-primary/30 hover:shadow-card-hover hover:-translate-y-1"
          >
            <div className="relative aspect-[2/3] overflow-hidden">
              <img
                src={thumb}
                alt={detail.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary shadow-glow">
                  <Play className="size-5 fill-white text-white translate-x-0.5" />
                </span>
              </div>
              <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                {interaction.content_type === "series" ? (
                  <><Tv2 className="size-3" /> Series</>
                ) : (
                  <><Film className="size-3" /> Movie</>
                )}
              </span>
            </div>
            <div className="p-2.5">
              <p className="truncate text-sm font-medium leading-snug">{detail.title}</p>
              {detail.release_date && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(detail.release_date).getFullYear()}
                </p>
              )}
            </div>
          </Link>
        );
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
