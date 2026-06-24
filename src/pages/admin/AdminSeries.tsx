import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import type { AppDispatch, RootState } from "@/store";
import { fetchSeriesThunk, upsertSeries, removeSeries, type BackendSeries, type BackendEpisode } from "@/store/slices/seriesSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { apiClient, assetUrl } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, Search, ArrowLeft,
  Upload, Link2, HardDrive, CloudUpload, ChevronDown, ChevronRight, Tv,
} from "lucide-react";
import type { ContentRating, WarningFlag } from "@/lib/mock-data";

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTENT_RATINGS: ContentRating[] = ["G", "PG", "PG-13", "16+", "18+", "21+"];
const WARNING_FLAGS: { key: WarningFlag; label: string }[] = [
  { key: "violence", label: "Violence" },
  { key: "strong_language", label: "Strong Language" },
  { key: "mature_themes", label: "Mature Themes" },
  { key: "nudity", label: "Nudity" },
];
const STATUS_COLORS: Record<string, string> = {
  published: "border-success/40 text-success bg-success/10",
  draft: "border-warning/40 text-warning bg-warning/10",
  archived: "border-muted-foreground/30 text-muted-foreground",
};

// ── Series form ───────────────────────────────────────────────────────────────

interface SeriesForm {
  title: string; description: string; category_id: string; status: "published" | "draft" | "archived";
  is_featured: boolean; language: string; content_rating: ContentRating | "";
  is_age_restricted: boolean; minimum_age: string; warning_flags: WarningFlag[];
  total_seasons: string; release_date: string;
  rating: string;
}

const EMPTY_SERIES: SeriesForm = {
  title: "", description: "", category_id: "none", status: "draft",
  is_featured: false, language: "", content_rating: "",
  is_age_restricted: false, minimum_age: "", warning_flags: [],
  total_seasons: "1", release_date: "",
  rating: "",
};

// ── Episode form ──────────────────────────────────────────────────────────────

interface EpisodeForm {
  season_number: string; episode_number: string; title: string; description: string;
  duration: string; release_date: string; status: "published" | "draft" | "archived";
  videoMode: "url" | "file" | "local"; video_url: string;
  rating: string;
}

const EMPTY_EPISODE: EpisodeForm = {
  season_number: "1", episode_number: "", title: "", description: "",
  duration: "", release_date: "", status: "draft",
  videoMode: "url", video_url: "",
  rating: "",
};

// ── Episode Manager ───────────────────────────────────────────────────────────

function EpisodeManager({ series, onClose }: { series: BackendSeries; onClose: () => void }) {
  const [episodes, setEpisodes] = useState<BackendEpisode[]>([]);
  const [loadingEps, setLoadingEps] = useState(true);
  const [openEpDialog, setOpenEpDialog] = useState(false);
  const [editingEp, setEditingEp] = useState<BackendEpisode | null>(null);
  const [epForm, setEpForm] = useState<EpisodeForm>(EMPTY_EPISODE);
  const [epThumbFile, setEpThumbFile] = useState<File | null>(null);
  const [epThumbPreview, setEpThumbPreview] = useState("");
  const [epVideoFile, setEpVideoFile] = useState<File | null>(null);
  const [savingEp, setSavingEp] = useState(false);
  const [epUploadProgress, setEpUploadProgress] = useState(0);
  const [deletingEpId, setDeletingEpId] = useState<number | null>(null);
  const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({ 1: true });
  const thumbRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEpisodes();
  }, [series.id]);

  async function loadEpisodes() {
    setLoadingEps(true);
    try {
      const { data } = await apiClient.get(`/series/${series.id}/episodes`);
      setEpisodes(data.data.episodes ?? []);
    } catch { setEpisodes([]); }
    finally { setLoadingEps(false); }
  }

  const seasons = Array.from(new Set(episodes.map((e) => e.season_number))).sort((a, b) => a - b);
  const maxSeason = series.total_seasons || 1;
  const allSeasons = Array.from({ length: maxSeason }, (_, i) => i + 1);

  function openAddEpisode(seasonNum = 1) {
    const existing = episodes.filter((e) => e.season_number === seasonNum);
    const nextEp = existing.length > 0 ? Math.max(...existing.map((e) => e.episode_number)) + 1 : 1;
    setEditingEp(null);
    setEpForm({ ...EMPTY_EPISODE, season_number: String(seasonNum), episode_number: String(nextEp) });
    setEpThumbFile(null); setEpThumbPreview(""); setEpVideoFile(null);
    setEpUploadProgress(0);
    setOpenEpDialog(true);
  }

  function openEditEpisode(ep: BackendEpisode) {
    setEditingEp(ep);
    setEpForm({
      season_number: String(ep.season_number),
      episode_number: String(ep.episode_number),
      title: ep.title,
      description: ep.description ?? "",
      duration: ep.duration ? String(ep.duration) : "",
      release_date: ep.release_date ?? "",
      status: ep.status,
      videoMode: ep.provider_name === "local" ? "local" : ep.video_url ? "url" : "file",
      video_url: ep.video_url ?? "",
      rating: ep.rating ? String(ep.rating) : "",
    });
    setEpThumbFile(null);
    setEpThumbPreview(ep.thumbnail_url ? assetUrl(ep.thumbnail_url) : "");
    setEpVideoFile(null);
    setEpUploadProgress(0);
    setOpenEpDialog(true);
  }

  async function handleSaveEpisode() {
    if (!epForm.title.trim()) { toast.error("Episode title is required"); return; }
    if (!epForm.episode_number) { toast.error("Episode number is required"); return; }
    setSavingEp(true);
    setEpUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append("season_number", epForm.season_number);
      fd.append("episode_number", epForm.episode_number);
      fd.append("title", epForm.title.trim());
      if (epForm.description) fd.append("description", epForm.description);
      if (epForm.duration) fd.append("duration", epForm.duration);
      if (epForm.release_date) fd.append("release_date", epForm.release_date);
      fd.append("status", epForm.status);
      if (epForm.rating.trim()) {
        const num = Number(epForm.rating);
        if (isNaN(num) || num < 0 || num > 10) {
          toast.error("Rating must be a number between 0.0 and 10.0");
          setSavingEp(false);
          return;
        }
        fd.append("rating", String(num.toFixed(1)));
      } else {
        fd.append("rating", "");
      }
      if (epForm.videoMode === "url" && epForm.video_url.trim()) fd.append("video_url", epForm.video_url.trim());
      else if (epForm.videoMode === "file" && epVideoFile) { fd.append("video", epVideoFile); fd.append("provider_name", "bunny"); }
      else if (epForm.videoMode === "local" && epVideoFile) { fd.append("video", epVideoFile); fd.append("provider_name", "local"); }
      if (epThumbFile) fd.append("thumbnail", epThumbFile);

      const axiosCfg = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt: { loaded: number; total?: number }) => {
          const pct = Math.round((evt.loaded * 100) / (evt.total || evt.loaded || 1));
          setEpUploadProgress(pct);
        },
      };

      if (editingEp) {
        await apiClient.put(`/series/${series.id}/episodes/${editingEp.id}`, fd, axiosCfg);
        toast.success("Episode updated");
      } else {
        await apiClient.post(`/series/${series.id}/episodes`, fd, axiosCfg);
        toast.success("Episode added");
      }
      setOpenEpDialog(false);
      loadEpisodes();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed";
      toast.error(msg);
    } finally { setSavingEp(false); setEpUploadProgress(0); }
  }

  async function handleDeleteEpisode(ep: BackendEpisode) {
    setDeletingEpId(ep.id);
    try {
      await apiClient.delete(`/series/${series.id}/episodes/${ep.id}`);
      setEpisodes((prev) => prev.filter((e) => e.id !== ep.id));
      toast.success(`Episode deleted`);
    } catch { toast.error("Delete failed"); }
    finally { setDeletingEpId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{series.title}</h3>
          <p className="text-xs text-muted-foreground">{episodes.length} episodes · {maxSeason} season{maxSeason !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      {loadingEps ? (
        <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {allSeasons.map((season) => {
            const seasonEps = episodes.filter((e) => e.season_number === season).sort((a, b) => a.episode_number - b.episode_number);
            const expanded = expandedSeasons[season] ?? false;
            return (
              <div key={season} className="rounded-xl border border-border overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 bg-card cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedSeasons((p) => ({ ...p, [season]: !p[season] }))}
                >
                  <div className="flex items-center gap-2">
                    {expanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                    <span className="font-medium">Season {season}</span>
                    <Badge variant="outline" className="text-xs">{seasonEps.length} ep{seasonEps.length !== 1 ? "s" : ""}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openAddEpisode(season); }}>
                    <Plus className="size-3.5 mr-1" /> Add Episode
                  </Button>
                </div>

                {expanded && (
                  <div className="divide-y divide-border/50">
                    {seasonEps.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">No episodes yet.</p>
                    ) : (
                      seasonEps.map((ep) => (
                        <div key={ep.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                          {ep.thumbnail_url ? (
                            <img src={assetUrl(ep.thumbnail_url)} alt={ep.title} className="size-14 rounded object-cover shrink-0 ring-1 ring-border" style={{ aspectRatio: "16/9", width: 80 }} />
                          ) : (
                            <div className="rounded bg-secondary shrink-0 flex items-center justify-center" style={{ width: 80, aspectRatio: "16/9" }}>
                              <Tv className="size-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">E{ep.episode_number} · {ep.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[ep.status] ?? ""}`}>{ep.status}</Badge>
                              {ep.duration && <span className="text-xs text-muted-foreground">{Math.round(ep.duration / 60)}m</span>}
                              {ep.video_url && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{ep.video_url.length > 40 ? ep.video_url.slice(0, 40) + "…" : ep.video_url}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEditEpisode(ep)}><Pencil className="size-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => handleDeleteEpisode(ep)} disabled={deletingEpId === ep.id}>
                              {deletingEpId === ep.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Episode Dialog */}
      <Dialog open={openEpDialog} onOpenChange={(o) => !savingEp && setOpenEpDialog(o)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEp ? "Edit Episode" : "Add Episode"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Season <span className="text-destructive">*</span></Label>
                <Input type="number" min="1" value={epForm.season_number} onChange={(e) => setEpForm({ ...epForm, season_number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Episode No. <span className="text-destructive">*</span></Label>
                <Input type="number" min="1" value={epForm.episode_number} onChange={(e) => setEpForm({ ...epForm, episode_number: e.target.value })} placeholder="e.g. 1" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={epForm.title} onChange={(e) => setEpForm({ ...epForm, title: e.target.value })} placeholder="Episode title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={epForm.description} onChange={(e) => setEpForm({ ...epForm, description: e.target.value })} rows={2} placeholder="Brief synopsis" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duration (seconds)</Label>
                <Input type="number" min="0" value={epForm.duration} onChange={(e) => setEpForm({ ...epForm, duration: e.target.value })} placeholder="e.g. 2700" />
              </div>
              <div className="space-y-1.5">
                <Label>Release Date</Label>
                <Input type="date" value={epForm.release_date} onChange={(e) => setEpForm({ ...epForm, release_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={epForm.status} onValueChange={(v) => setEpForm({ ...epForm, status: v as EpisodeForm["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>IMDb Rating (0.0 - 10.0)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={epForm.rating}
                  onChange={(e) => setEpForm({ ...epForm, rating: e.target.value })}
                  placeholder="e.g. 8.5"
                />
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <Label>Thumbnail</Label>
              <div className="flex items-start gap-3">
                {epThumbPreview && <img src={epThumbPreview} alt="" className="h-16 rounded object-cover ring-1 ring-border shrink-0" style={{ aspectRatio: "16/9" }} />}
                <div>
                  <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEpThumbFile(f); setEpThumbPreview(URL.createObjectURL(f)); } }} />
                  <Button type="button" variant="secondary" size="sm" onClick={() => thumbRef.current?.click()}>
                    <Upload className="mr-1.5 size-3.5" />{epThumbPreview ? "Change" : "Upload Thumbnail"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Video */}
            <div className="space-y-3">
              <Label>Video Source</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={epForm.videoMode === "url" ? "default" : "secondary"} onClick={() => setEpForm({ ...epForm, videoMode: "url" })}>
                  <Link2 className="mr-1 size-3.5" /> External URL
                </Button>
                <Button type="button" size="sm" variant={epForm.videoMode === "file" ? "default" : "secondary"} onClick={() => setEpForm({ ...epForm, videoMode: "file" })}>
                  <CloudUpload className="mr-1 size-3.5" /> Bunny Stream
                </Button>
                <Button type="button" size="sm" variant={epForm.videoMode === "local" ? "default" : "secondary"} onClick={() => setEpForm({ ...epForm, videoMode: "local" })}>
                  <HardDrive className="mr-1 size-3.5" /> Local Storage
                </Button>
              </div>
              {epForm.videoMode === "url" && (
                <Input value={epForm.video_url} onChange={(e) => setEpForm({ ...epForm, video_url: e.target.value })} placeholder="https://example.com/video.m3u8 or YouTube URL" />
              )}
              {(epForm.videoMode === "file" || epForm.videoMode === "local") && (
                <div className="space-y-2">
                  <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => { setEpVideoFile(e.target.files?.[0] ?? null); setEpUploadProgress(0); }} />
                  <Button type="button" variant="secondary" size="sm" onClick={() => videoRef.current?.click()}>
                    <Upload className="mr-1.5 size-3.5" />{epVideoFile ? epVideoFile.name : "Choose Video File"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {epForm.videoMode === "local"
                      ? "MP4, MKV or MOV. File will be stored on the server's local disk."
                      : "MP4, MKV or MOV. File will be uploaded to Bunny Stream CDN."}
                  </p>
                  {savingEp && epVideoFile && epUploadProgress > 0 && epUploadProgress < 100 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{epForm.videoMode === "local" ? "Uploading to server…" : "Uploading to Bunny Stream…"}</span>
                        <span>{epUploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${epUploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                  {savingEp && epVideoFile && epUploadProgress === 100 && epForm.videoMode === "file" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" /> Processing on Bunny Stream…
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenEpDialog(false)} disabled={savingEp}>Cancel</Button>
            <Button onClick={handleSaveEpisode} disabled={savingEp}>
              {savingEp && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingEp ? "Save Changes" : "Add Episode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSeries() {
  return (
    <Protected roles={["super_admin", "admin", "content_manager", "team_member"]}>
      <SeriesPage />
    </Protected>
  );
}

function SeriesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((s: RootState) => s.series);
  const { items: categories } = useSelector((s: RootState) => s.categories);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BackendSeries | null>(null);
  const [form, setForm] = useState<SeriesForm>(EMPTY_SERIES);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BackendSeries | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [managingSeries, setManagingSeries] = useState<BackendSeries | null>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const refreshSeries = useCallback(() => {
    dispatch(fetchSeriesThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSeriesThunk());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Real-time: refresh when series changes
  useSocketEvent(SOCKET_EVENTS.SERIES_CREATED, refreshSeries);
  useSocketEvent(SOCKET_EVENTS.SERIES_UPDATED, refreshSeries);
  useSocketEvent(SOCKET_EVENTS.SERIES_DELETED, refreshSeries);

  const filtered = items.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));

  function openAdd() {
    setEditing(null); setForm(EMPTY_SERIES); setThumbFile(null); setThumbPreview(""); setOpen(true);
  }

  function openEdit(s: BackendSeries) {
    setEditing(s);
    setForm({
      title: s.title, description: s.description ?? "", category_id: s.category_id ? String(s.category_id) : "none",
      status: s.status, is_featured: s.is_featured, language: s.language ?? "",
      content_rating: (s.content_rating ?? "") as ContentRating | "",
      is_age_restricted: s.is_age_restricted ?? false, minimum_age: s.minimum_age ? String(s.minimum_age) : "",
      warning_flags: s.warning_flags_json ?? [], total_seasons: String(s.total_seasons ?? 1),
      release_date: s.release_date ?? "",
      rating: s.rating ? String(s.rating) : "",
    });
    setThumbFile(null); setThumbPreview(s.thumbnail_url ? assetUrl(s.thumbnail_url) : ""); setOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      if (form.description) fd.append("description", form.description);
      if (form.category_id !== "none") fd.append("category_id", form.category_id);
      fd.append("status", form.status);
      fd.append("is_featured", String(form.is_featured));
      if (form.language) fd.append("language", form.language);
      if (form.content_rating) fd.append("content_rating", form.content_rating);
      fd.append("is_age_restricted", String(form.is_age_restricted));
      if (form.minimum_age) fd.append("minimum_age", form.minimum_age);
      if (form.warning_flags.length) fd.append("warning_flags_json", JSON.stringify(form.warning_flags));
      fd.append("total_seasons", form.total_seasons || "1");
      if (form.rating.trim()) {
        const num = Number(form.rating);
        if (isNaN(num) || num < 0 || num > 10) {
          toast.error("Rating must be a number between 0.0 and 10.0");
          setSaving(false);
          return;
        }
        fd.append("rating", String(num.toFixed(1)));
      } else {
        fd.append("rating", "");
      }
      if (form.release_date) fd.append("release_date", form.release_date);
      if (thumbFile) fd.append("thumbnail", thumbFile);

      const cfg = { headers: { "Content-Type": "multipart/form-data" } };
      let resData: BackendSeries;
      if (editing) {
        const { data } = await apiClient.put(`/series/${editing.id}`, fd, cfg);
        resData = data.data.series;
        toast.success("Series updated");
      } else {
        const { data } = await apiClient.post("/series", fd, cfg);
        resData = data.data.series;
        toast.success("Series created");
      }
      dispatch(upsertSeries(resData));
      setOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed";
      toast.error(msg);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/series/${deleteTarget.id}`);
      dispatch(removeSeries(deleteTarget.id));
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
    } catch { toast.error("Delete failed"); }
    finally { setDeleting(false); }
  }

  return (
    <DashboardLayout title="Web Series Management">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" asChild><Link to="/admin"><ArrowLeft className="mr-1 size-4" /> Back to Dashboard</Link></Button>
          <div className="flex gap-2">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search series…" className="pl-9" />
            </div>
            <Button onClick={openAdd}><Plus className="mr-1.5 size-4" /> Add Series</Button>
          </div>
        </div>

        {/* Manage Episodes panel */}
        {managingSeries && (
          <div className="rounded-xl border border-primary/30 bg-card p-5">
            <EpisodeManager series={managingSeries} onClose={() => { setManagingSeries(null); dispatch(fetchSeriesThunk()); }} />
          </div>
        )}

        {/* Series table */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">{filtered.length} series</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
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
                    <th className="px-6 py-3 font-medium hidden xl:table-cell">Seasons</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {s.thumbnail_url ? (
                            <img src={assetUrl(s.thumbnail_url)} alt={s.title} className="size-10 rounded object-cover shrink-0 ring-1 ring-border" />
                          ) : (
                            <div className="size-10 rounded bg-secondary shrink-0 flex items-center justify-center"><Tv className="size-4 text-muted-foreground" /></div>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{s.title}</p>
                            <p className="text-xs text-muted-foreground">{s.total_seasons} season{s.total_seasons !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell text-muted-foreground text-xs">{s.category?.name ?? "—"}</td>
                      <td className="px-6 py-3 hidden lg:table-cell text-muted-foreground text-xs">{s.language ?? "—"}</td>
                      <td className="px-6 py-3 hidden lg:table-cell text-xs">
                        {s.content_rating ? (
                          <span className="inline-flex items-center rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">{s.content_rating}</span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[s.status] ?? ""}`}>{s.status}</Badge>
                      </td>
                      <td className="px-6 py-3 hidden xl:table-cell text-muted-foreground text-xs">{s.total_seasons}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setManagingSeries(managingSeries?.id === s.id ? null : s)}>
                            <Tv className="size-3 mr-1" /> Episodes
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(s)}><Pencil className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(s)}><Trash2 className="size-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-16 text-center text-muted-foreground text-sm">{search ? "No series match your search." : "No series yet. Add your first one."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Series Dialog */}
      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Series" : "Add Web Series"}</DialogTitle></DialogHeader>
          <Tabs defaultValue="basic" className="py-2">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
              <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
              <TabsTrigger value="restrictions" className="flex-1">Restrictions</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Series title" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Synopsis" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No category —</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SeriesForm["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label>Language</Label><Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="e.g. English" /></div>
                <div className="space-y-2"><Label>Total Seasons</Label><Input type="number" min="1" value={form.total_seasons} onChange={(e) => setForm({ ...form, total_seasons: e.target.value })} /></div>
                <div className="space-y-2"><Label>Release Date</Label><Input type="date" value={form.release_date} onChange={(e) => setForm({ ...form, release_date: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="sf" checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: Boolean(v) })} />
                <Label htmlFor="sf" className="font-normal">Mark as Featured</Label>
              </div>
            </TabsContent>

            {/* Media */}
            <TabsContent value="media" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Cover Thumbnail</Label>
                <div className="flex items-start gap-3">
                  {thumbPreview && <img src={thumbPreview} alt="Preview" className="h-24 rounded object-cover ring-1 ring-border shrink-0" />}
                  <div>
                    <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); } }} />
                    <Button type="button" variant="secondary" size="sm" onClick={() => thumbRef.current?.click()}>
                      <Upload className="mr-1.5 size-4" />{thumbPreview ? "Change Thumbnail" : "Upload Thumbnail"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WEBP. Max 10 MB.</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Restrictions */}
            <TabsContent value="restrictions" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Content Rating</Label>
                  <Select value={form.content_rating || "none"} onValueChange={(v) => setForm({ ...form, content_rating: v === "none" ? "" : v as ContentRating })}>
                    <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No rating —</SelectItem>
                      {CONTENT_RATINGS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>IMDb Rating (0.0 - 10.0)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    placeholder="e.g. 8.5"
                  />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox id="sar" checked={form.is_age_restricted} onCheckedChange={(v) => setForm({ ...form, is_age_restricted: Boolean(v) })} />
                  <Label htmlFor="sar" className="font-medium">Age Restricted</Label>
                </div>
                {form.is_age_restricted && (
                  <div className="space-y-1.5 pl-6">
                    <Label>Minimum Age</Label>
                    <Input type="number" min="13" max="21" value={form.minimum_age} onChange={(e) => setForm({ ...form, minimum_age: e.target.value })} placeholder="e.g. 18" className="max-w-[120px]" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Content Warnings</Label>
                <div className="grid grid-cols-2 gap-2">
                  {WARNING_FLAGS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox id={`sf-${key}`} checked={form.warning_flags.includes(key)} onCheckedChange={(checked) => setForm({ ...form, warning_flags: checked ? [...form.warning_flags, key] : form.warning_flags.filter((f) => f !== key) })} />
                      <Label htmlFor={`sf-${key}`} className="font-normal text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Series"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !deleting && !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Series</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Permanently delete <strong>"{deleteTarget?.title}"</strong>? All episodes will also be deleted.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
