import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchMoviesThunk,
  upsertMovie,
  removeMovie,
  type BackendMovie,
} from "@/store/slices/moviesSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { apiClient, assetUrl } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  ArrowLeft,
  Upload,
  Link2,
  HardDrive,
  CloudUpload,
  Film,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminMovies() {
  return (
    <Protected roles={["super_admin"]}>
      <MoviesPage />
    </Protected>
  );
}

import type { ContentRating, WarningFlag } from "@/lib/mock-data";

const CONTENT_RATINGS: ContentRating[] = ["G", "PG", "PG-13", "16+", "18+", "21+"];
const WARNING_FLAGS: { key: WarningFlag; label: string }[] = [
  { key: "violence", label: "Violence" },
  { key: "strong_language", label: "Strong Language" },
  { key: "mature_themes", label: "Mature Themes" },
  { key: "nudity", label: "Nudity" },
];

interface MovieForm {
  title: string;
  description: string;
  category_id: string;
  status: "published" | "draft" | "archived";
  is_featured: boolean;
  duration: string;
  release_date: string;
  videoMode: "file" | "url" | "local";
  video_url: string;
  language: string;
  content_rating: ContentRating | "";
  is_age_restricted: boolean;
  minimum_age: string;
  warning_flags: WarningFlag[];
}

const EMPTY_FORM: MovieForm = {
  title: "",
  description: "",
  category_id: "none",
  status: "draft",
  is_featured: false,
  duration: "",
  release_date: "",
  videoMode: "url",
  video_url: "",
  language: "",
  content_rating: "",
  is_age_restricted: false,
  minimum_age: "",
  warning_flags: [],
};

const STATUS_COLORS: Record<string, string> = {
  published: "border-success/40 text-success bg-success/10",
  draft: "border-warning/40 text-warning bg-warning/10",
  archived: "border-muted-foreground/30 text-muted-foreground",
};

function MoviesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((s: RootState) => s.movies);
  const { items: categories } = useSelector((s: RootState) => s.categories);
  console.log('categories: ', categories);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BackendMovie | null>(null);
  const [form, setForm] = useState<MovieForm>(EMPTY_FORM);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<BackendMovie | null>(null);
  const [deleting, setDeleting] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchMoviesThunk());
    dispatch(fetchCategories());
  }, [dispatch]);

  const filtered = items.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setThumbnailFile(null);
    setThumbnailPreview("");
    setVideoFile(null);
    setUploadProgress(0);
    setOpen(true);
  }

  function openEdit(movie: BackendMovie) {
    setEditing(movie);
    const isLocal = movie.provider_name === "local";
    const isBunny = movie.provider_name === "bunny" && !movie.video_url?.startsWith("http");
    setForm({
      title: movie.title,
      description: movie.description ?? "",
      category_id: movie.category_id ? String(movie.category_id) : "none",
      status: movie.status,
      is_featured: movie.is_featured,
      duration: movie.duration ? String(movie.duration) : "",
      release_date: movie.release_date ?? "",
      videoMode: isLocal ? "local" : isBunny ? "file" : movie.video_url ? "url" : "file",
      video_url: movie.video_url ?? "",
      language: movie.language ?? "",
      content_rating: (movie.content_rating ?? "") as ContentRating | "",
      is_age_restricted: movie.is_age_restricted ?? false,
      minimum_age: movie.minimum_age ? String(movie.minimum_age) : "",
      warning_flags: movie.warning_flags_json ?? [],
    });
    setThumbnailFile(null);
    setThumbnailPreview(movie.thumbnail_url ? assetUrl(movie.thumbnail_url) : "");
    setVideoFile(null);
    setUploadProgress(0);
    setOpen(true);
  }

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      if (form.description) fd.append("description", form.description);
      if (form.category_id && form.category_id !== "none") fd.append("category_id", form.category_id);
      fd.append("status", form.status);
      fd.append("is_featured", String(form.is_featured));
      if (form.duration) fd.append("duration", form.duration);
      if (form.release_date) fd.append("release_date", form.release_date);
      if (form.language) fd.append("language", form.language.trim());
      if (form.content_rating) fd.append("content_rating", form.content_rating);
      fd.append("is_age_restricted", String(form.is_age_restricted));
      if (form.minimum_age) fd.append("minimum_age", form.minimum_age);
      if (form.warning_flags.length > 0) fd.append("warning_flags_json", JSON.stringify(form.warning_flags));

      if (form.videoMode === "url" && form.video_url.trim()) {
        fd.append("video_url", form.video_url.trim());
      } else if (form.videoMode === "file" && videoFile) {
        fd.append("video", videoFile);
        fd.append("provider_name", "bunny");
      } else if (form.videoMode === "local" && videoFile) {
        fd.append("video", videoFile);
        fd.append("provider_name", "local");
      }

      if (thumbnailFile) {
        fd.append("thumbnail", thumbnailFile);
      }

      const axiosConfig = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt: { loaded: number; total?: number }) => {
          const pct = Math.round((evt.loaded * 100) / (evt.total || evt.loaded || 1));
          setUploadProgress(pct);
        },
      };

      let resData: BackendMovie;
      if (editing) {
        const { data } = await apiClient.put(`/movies/${editing.id}`, fd, axiosConfig);
        resData = data.data.movie;
        toast.success("Movie updated");
      } else {
        const { data } = await apiClient.post("/movies", fd, axiosConfig);
        resData = data.data.movie;
        toast.success("Movie created");
      }
      dispatch(upsertMovie(resData));
      setOpen(false);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string; errors?: { message: string }[] } };
      };
      const msg =
        e?.response?.data?.errors?.[0]?.message ??
        e?.response?.data?.message ??
        "Operation failed";
      toast.error(msg);
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/movies/${deleteTarget.id}`);
      dispatch(removeMovie(deleteTarget.id));
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Delete failed";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(movie: BackendMovie) {
    const next = movie.status === "published" ? "draft" : "published";
    try {
      const { data } = await apiClient.put(
        `/movies/${movie.id}`,
        { status: next },
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      dispatch(upsertMovie(data.data.movie));
      toast.success(`"${movie.title}" ${next === "published" ? "published" : "unpublished"}`);
    } catch {
      toast.error("Could not update status");
    }
  }

  return (
    <DashboardLayout title="Movie / Show Management">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" asChild className="rounded-lg w-fit">
            <Link to="/admin">
              <ArrowLeft className="mr-1 size-4" /> Back to Dashboard
            </Link>
          </Button>
          <div className="flex gap-2">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search movies…"
                className="pl-9 h-10 rounded-xl"
              />
            </div>
            <Button onClick={openAdd} className="h-10 rounded-xl font-bold shadow-glow-sm">
              <Plus className="mr-1.5 size-4" /> Add Movie
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <h2 className="font-extrabold tracking-tight">Content Library</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filtered.length} title{filtered.length !== 1 ? "s" : ""} · {items.filter((m) => m.status === "published").length} published
              </p>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium hidden md:table-cell">Category</th>
                    <th className="px-6 py-3 font-medium hidden lg:table-cell">Language</th>
                    <th className="px-6 py-3 font-medium hidden lg:table-cell">Rating</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium hidden xl:table-cell">Featured</th>
                    <th className="px-6 py-3 font-medium hidden xl:table-cell">Added</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((movie) => (
                    <tr
                      key={movie.id}
                      className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {movie.thumbnail_url ? (
                            <img
                              src={assetUrl(movie.thumbnail_url)}
                              alt={movie.title}
                              className="size-10 rounded object-cover shrink-0 ring-1 ring-border"
                            />
                          ) : (
                            <div className="size-10 rounded bg-secondary shrink-0" />
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{movie.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {movie.duration
                                ? `${Math.round(movie.duration / 60)}m`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell text-muted-foreground text-xs">
                        {movie.category?.name ?? "—"}
                      </td>
                      <td className="px-6 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {movie.language ?? "—"}
                      </td>
                      <td className="px-6 py-3 hidden lg:table-cell text-xs">
                        {movie.content_rating ? (
                          <span className="inline-flex items-center rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
                            {movie.content_rating}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs cursor-pointer ${STATUS_COLORS[movie.status] ?? ""}`}
                          onClick={() => toggleStatus(movie)}
                          title="Click to toggle publish"
                        >
                          {movie.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                        {movie.is_featured ? "Yes" : "No"}
                      </td>
                      <td className="px-6 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                        {new Date(movie.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(movie)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(movie)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-16 text-center text-muted-foreground text-sm"
                      >
                        {search
                          ? "No movies match your search."
                          : "No movies yet. Add your first one."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/60 bg-[oklch(0.11_0.016_258)]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Film className="size-4.5" />
              </div>
              <DialogTitle className="text-lg font-extrabold">{editing ? "Edit Movie" : "Add Movie / Show"}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Movie or show title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Synopsis / description"
                rows={3}
              />
            </div>

            {/* Category + Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form?.category_id}
                  onValueChange={(v) => setForm({ ...form, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No category —</SelectItem>
                    {categories?.map((c) => (
                      <SelectItem key={c?.id} value={String(c?.id)}>
                        {c?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      status: v as "published" | "draft" | "archived",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration + Release Date */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 5400 for 90 min"
                />
              </div>
              <div className="space-y-2">
                <Label>Release Date</Label>
                <Input
                  type="date"
                  value={form.release_date}
                  onChange={(e) =>
                    setForm({ ...form, release_date: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Featured */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_featured"
                checked={form.is_featured}
                onCheckedChange={(v) =>
                  setForm({ ...form, is_featured: Boolean(v) })
                }
              />
              <Label htmlFor="is_featured" className="font-normal">
                Mark as Featured
              </Label>
            </div>

            {/* Language + Content Rating */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
                <Input
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  placeholder="e.g. English, Hindi, Korean"
                />
              </div>
              <div className="space-y-2">
                <Label>Content Rating</Label>
                <Select
                  value={form.content_rating || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, content_rating: v === "none" ? "" : v as ContentRating })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No rating —</SelectItem>
                    {CONTENT_RATINGS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Age Restriction */}
            <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_age_restricted"
                  checked={form.is_age_restricted}
                  onCheckedChange={(v) =>
                    setForm({ ...form, is_age_restricted: Boolean(v) })
                  }
                />
                <Label htmlFor="is_age_restricted" className="font-medium">
                  Age Restricted Content
                </Label>
              </div>
              {form.is_age_restricted && (
                <div className="space-y-2 pl-6">
                  <Label className="text-sm">Minimum Age</Label>
                  <Input
                    type="number"
                    min="13"
                    max="21"
                    value={form.minimum_age}
                    onChange={(e) => setForm({ ...form, minimum_age: e.target.value })}
                    placeholder="e.g. 18"
                    className="max-w-[120px]"
                  />
                </div>
              )}
            </div>

            {/* Content Warnings */}
            <div className="space-y-2">
              <Label>Content Warnings</Label>
              <div className="grid grid-cols-2 gap-2">
                {WARNING_FLAGS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`flag-${key}`}
                      checked={form.warning_flags.includes(key)}
                      onCheckedChange={(checked) => {
                        setForm({
                          ...form,
                          warning_flags: checked
                            ? [...form.warning_flags, key]
                            : form.warning_flags.filter((f) => f !== key),
                        });
                      }}
                    />
                    <Label htmlFor={`flag-${key}`} className="font-normal text-sm">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <div className="flex items-start gap-3">
                {thumbnailPreview && (
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="size-20 rounded object-cover ring-1 ring-border shrink-0"
                  />
                )}
                <div className="flex-1 space-y-1">
                  <input
                    ref={thumbRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => thumbRef.current?.click()}
                  >
                    <Upload className="mr-1.5 size-4" />
                    {thumbnailPreview ? "Change Thumbnail" : "Upload Thumbnail"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or WEBP. Max 10 MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Video source */}
            <div className="space-y-3">
              <Label>Video Source</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={form.videoMode === "url" ? "default" : "secondary"}
                  onClick={() => setForm({ ...form, videoMode: "url" })}
                >
                  <Link2 className="mr-1 size-4" /> External URL
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={form.videoMode === "file" ? "default" : "secondary"}
                  onClick={() => setForm({ ...form, videoMode: "file" })}
                >
                  <CloudUpload className="mr-1 size-4" /> Bunny Stream
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={form.videoMode === "local" ? "default" : "secondary"}
                  onClick={() => setForm({ ...form, videoMode: "local" })}
                >
                  <HardDrive className="mr-1 size-4" /> Local Storage
                </Button>
              </div>

              {form.videoMode === "url" && (
                <Input
                  value={form.video_url}
                  onChange={(e) =>
                    setForm({ ...form, video_url: e.target.value })
                  }
                  placeholder="https://example.com/video.m3u8 or YouTube/Vimeo URL"
                />
              )}

              {(form.videoMode === "file" || form.videoMode === "local") && (
                <div className="space-y-2">
                  <input
                    ref={videoRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      setVideoFile(e.target.files?.[0] ?? null);
                      setUploadProgress(0);
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => videoRef.current?.click()}
                  >
                    <Upload className="mr-1.5 size-4" />
                    {videoFile ? videoFile.name : "Choose Video File"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {form.videoMode === "local"
                      ? "MP4, MKV or MOV. File will be stored on the server's local disk."
                      : "MP4, MKV or MOV. File will be uploaded to Bunny Stream CDN."}
                  </p>
                  {saving && videoFile && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {form.videoMode === "local" ? "Uploading to server…" : "Uploading to Bunny Stream…"}
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {saving && videoFile && uploadProgress === 100 && form.videoMode === "file" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" /> Processing on Bunny Stream…
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Movie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !deleting && !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md rounded-2xl border-border/60 bg-[oklch(0.11_0.016_258)]">
          <DialogHeader>
            <DialogTitle className="font-extrabold">Delete Movie</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-destructive/20 bg-destructive/8 p-4 text-sm text-muted-foreground">
            Permanently delete <strong className="text-foreground">"{deleteTarget?.title}"</strong>?
            This action cannot be undone and will remove all associated data.
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl font-bold"
            >
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
