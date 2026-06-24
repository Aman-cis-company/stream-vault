import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchMoviesThunk,
  type BackendMovie,
} from "@/store/slices/moviesSlice";
import { apiClient, assetUrl } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Film,
  Sparkles,
  Save,
  Undo2,
} from "lucide-react";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";

export default function AdminBannerPage() {
  return (
    <Protected roles={["super_admin", "admin", "content_manager", "team_member"]}>
      <AdminBanner />
    </Protected>
  );
}

function AdminBanner() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: allMovies, loading } = useSelector((s: RootState) => s.movies);

  const [bannerList, setBannerList] = useState<BackendMovie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    dispatch(fetchMoviesThunk());
  }, [dispatch]);

  // Load movies on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Sync state when movies are loaded/changed
  useEffect(() => {
    // Filter out movies marked as banner, sort them by banner_order
    const activeBanners = allMovies
      .filter((m) => m.is_banner && m.status === "published")
      .sort((a, b) => (a.banner_order ?? 0) - (b.banner_order ?? 0));
    setBannerList(activeBanners);
  }, [allMovies]);

  // Real-time updates
  useSocketEvent(SOCKET_EVENTS.MOVIE_CREATED, refresh);
  useSocketEvent(SOCKET_EVENTS.MOVIE_UPDATED, refresh);
  useSocketEvent(SOCKET_EVENTS.MOVIE_DELETED, refresh);

  // Available movies pool: published movies NOT in the current bannerList
  const availableMovies = allMovies
    .filter(
      (m) => m.status === "published" && !bannerList.some((b) => b.id === m.id),
    )
    .filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Actions
  const addToBanner = (movie: BackendMovie) => {
    if (bannerList.length >= 10) {
      toast.warning(
        "You can add a maximum of 10 movies to the banner rotation.",
      );
      return;
    }
    setBannerList((prev) => [...prev, movie]);
    toast.success(`"${movie.title}" added to banner queue.`);
  };

  const removeFromBanner = (id: number) => {
    const targetMovie = bannerList.find((m) => m.id === id);
    setBannerList((prev) => prev.filter((m) => m.id !== id));
    if (targetMovie) {
      toast.info(`"${targetMovie.title}" removed from banner queue.`);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setBannerList((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index === bannerList.length - 1) return;
    setBannerList((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const saveSequence = async () => {
    setSaving(true);
    try {
      const movieIds = bannerList.map((m) => m.id);
      await apiClient.put("/movies/banner", { movieIds });
      toast.success("Hero banner configuration saved successfully!");
      refresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save banner sequence";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    const activeBanners = allMovies
      .filter((m) => m.is_banner && m.status === "published")
      .sort((a, b) => (a.banner_order ?? 0) - (b.banner_order ?? 0));
    setBannerList(activeBanners);
    toast.info("Changes reset to saved database state.");
  };

  return (
    <DashboardLayout title="Hero Banner Configuration">
      <div className="space-y-6">
        {/* Header navigation & actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="rounded-lg w-fit"
          >
            <Link to="/admin">
              <ArrowLeft className="mr-1 size-4" /> Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetChanges}
              disabled={saving}
              className="rounded-xl h-10 gap-1.5"
            >
              <Undo2 className="size-4" /> Reset
            </Button>
            <Button
              onClick={saveSequence}
              disabled={saving}
              className="rounded-xl h-10 gap-1.5 font-bold shadow-glow-sm bg-amber-500 hover:bg-amber-600 text-black border-amber-500/20"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Sequence
            </Button>
          </div>
        </div>

        {/* Intro Banner info */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 flex items-start gap-4">
          <div className="size-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 ring-1 ring-amber-500/25">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-300">
              Custom Hero Banner Sequence
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-3xl">
              Specify which published movies are featured in the landing /
              browse page Hero slider rotation. The order of items in the left
              panel defines the scroll sequence. We recommend selecting 4 to 8
              titles with high-quality backdrops/posters.
            </p>
          </div>
        </div>

        {/* Core Layout Panels */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
          {/* Left panel: Banner Queue */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5 text-amber-400">
                <Sparkles className="size-4" /> Banner Queue (
                {bannerList.length}/10)
              </h3>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-4 space-y-2 min-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-[350px]">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : bannerList.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-[350px] p-6">
                  <div className="size-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-3 text-muted-foreground/40">
                    <Film className="size-6" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Queue is empty
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">
                    No movies designated for the banner. Add movies from the
                    available list on the right.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {bannerList.map((movie, idx) => (
                    <div
                      key={movie.id}
                      className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all duration-200"
                    >
                      {/* Sequence index */}
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold ring-1 ring-amber-500/20">
                        {idx + 1}
                      </span>

                      {/* Thumbnail & Title info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {movie.thumbnail_url ? (
                          <img
                            src={assetUrl(movie.thumbnail_url)}
                            alt={movie.title}
                            className="size-12 rounded object-cover shrink-0 ring-1 ring-border"
                          />
                        ) : (
                          <div className="size-12 rounded bg-secondary shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm line-clamp-1">
                            {movie.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">
                            {movie.category?.name ?? "Uncategorized"}
                          </p>
                        </div>
                      </div>

                      {/* Actions: Reorder + Remove */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={idx === 0}
                          onClick={() => moveUp(idx)}
                          className="size-7 rounded-lg hover:bg-white/10"
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={idx === bannerList.length - 1}
                          onClick={() => moveDown(idx)}
                          className="size-7 rounded-lg hover:bg-white/10"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromBanner(movie.id)}
                          className="size-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Available Content Pool */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-extrabold text-sm tracking-tight text-muted-foreground">
                Available Movies & Shows
              </h3>

              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search available content…"
                  className="pl-9 h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/20 p-4 space-y-2 min-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-[350px]">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableMovies.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-[350px]">
                  <div className="size-10 rounded-xl bg-muted/20 flex items-center justify-center mb-2.5 text-muted-foreground/30">
                    <Search className="size-5" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    No available movies
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1 max-w-[200px]">
                    {searchQuery
                      ? "Try adjusting your search filter."
                      : "All published movies are already in the banner queue."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2 max-h-[600px] overflow-y-auto pr-1">
                  {availableMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className="group flex items-center gap-3 p-2.5 rounded-xl border border-border/40 bg-secondary/5 hover:bg-secondary/15 transition-all duration-200"
                    >
                      {movie.thumbnail_url ? (
                        <img
                          src={assetUrl(movie.thumbnail_url)}
                          alt={movie.title}
                          className="size-11 rounded object-cover shrink-0 ring-1 ring-border"
                        />
                      ) : (
                        <div className="size-11 rounded bg-secondary shrink-0" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs line-clamp-1 group-hover:text-amber-400 transition-colors">
                          {movie.title}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                          {movie.category?.name ?? "Uncategorized"}
                        </p>
                      </div>

                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => addToBanner(movie)}
                        className="size-7 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black shrink-0 transition-colors"
                        title="Add to Banner"
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
