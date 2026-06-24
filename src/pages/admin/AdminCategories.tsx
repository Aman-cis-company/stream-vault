import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchCategories,
  upsertCategory,
  removeCategory,
  type Category,
} from "@/store/slices/categoriesSlice";
import { apiClient } from "@/services/api";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Search, ArrowLeft, Tag } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

export default function AdminCategories() {
  return (
    <Protected roles={["super_admin", "admin", "content_manager", "team_member"]}>
      <CategoriesPage />
    </Protected>
  );
}

interface FormState {
  name: string;
  description: string;
  status: "active" | "inactive";
  is_age_restricted: boolean;
  minimum_age: string;
}

const EMPTY_FORM: FormState = { name: "", description: "", status: "active", is_age_restricted: false, minimum_age: "" };

function CategoriesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((s: RootState) => s.categories);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const filtered = items.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      status: cat.status,
      is_age_restricted: cat.is_age_restricted ?? false,
      minimum_age: cat.minimum_age ? String(cat.minimum_age) : "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { data } = await apiClient.put(`/categories/${editing.id}`, {
          name: form.name.trim(),
          description: form.description || null,
          status: form.status,
          is_age_restricted: form.is_age_restricted,
          minimum_age: form.minimum_age ? Number(form.minimum_age) : null,
        });
        dispatch(upsertCategory(data.data.category));
        toast.success("Category updated");
      } else {
        const { data } = await apiClient.post("/categories", {
          name: form.name.trim(),
          description: form.description || null,
          status: form.status,
          is_age_restricted: form.is_age_restricted,
          minimum_age: form.minimum_age ? Number(form.minimum_age) : null,
        });
        dispatch(upsertCategory(data.data.category));
        toast.success("Category created");
      }
      setOpen(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Operation failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/categories/${deleteTarget.id}`);
      dispatch(removeCategory(deleteTarget.id));
      toast.success(`"${deleteTarget.name}" deleted`);
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

  return (
    <DashboardLayout title="Category Management">
      <div className="space-y-6">
        {/* Back + actions */}
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
                placeholder="Search categories..."
                className="pl-9 h-10 rounded-xl"
              />
            </div>
            <Button onClick={openAdd} className="h-10 rounded-xl font-bold shadow-glow-sm">
              <Plus className="mr-1.5 size-4" /> Add Category
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <h2 className="font-extrabold tracking-tight">Category Management</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filtered.length} categor{filtered.length === 1 ? "y" : "ies"} · {items.filter((c) => c.status === "active").length} active
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
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium hidden md:table-cell">
                      Description
                    </th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium hidden lg:table-cell">Age Restricted</th>
                    <th className="px-6 py-3 font-medium hidden lg:table-cell">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">{cat.name}</td>
                      <td className="px-6 py-4 text-muted-foreground hidden md:table-cell max-w-xs truncate">
                        {cat.description ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={
                            cat.status === "active"
                              ? "border-success/40 text-success bg-success/10"
                              : "border-muted-foreground/30 text-muted-foreground"
                          }
                        >
                          {cat.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-xs">
                        {cat.is_age_restricted ? (
                          <span className="inline-flex items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                            {cat.minimum_age ? `${cat.minimum_age}+` : "Yes"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell text-xs">
                        {new Date(cat.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(cat)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(cat)}
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
                        colSpan={6}
                        className="px-6 py-16 text-center text-muted-foreground text-sm"
                      >
                        {search
                          ? "No categories match your search."
                          : "No categories yet. Create your first one."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="rounded-2xl border-border/60 bg-[oklch(0.11_0.016_258)]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="inline-flex size-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                <Tag className="size-4.5" />
              </div>
              <DialogTitle className="font-extrabold">
                {editing ? "Edit Category" : "Create Category"}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Action, Drama, Trending…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as "active" | "inactive" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Age restriction */}
            <div className="space-y-3 rounded-lg border border-border bg-card/50 p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cat-age-restricted"
                  checked={form.is_age_restricted}
                  onCheckedChange={(v) =>
                    setForm({ ...form, is_age_restricted: Boolean(v) })
                  }
                />
                <Label htmlFor="cat-age-restricted" className="font-normal">
                  Age Restricted Category
                </Label>
              </div>
              {form.is_age_restricted && (
                <div className="space-y-1.5 pl-6">
                  <Label htmlFor="cat-min-age" className="text-sm">Minimum Age</Label>
                  <Input
                    id="cat-min-age"
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
              {editing ? "Save Changes" : "Create"}
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
            <DialogTitle className="font-extrabold">Delete Category</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-destructive/20 bg-destructive/8 p-4 text-sm text-muted-foreground">
            Are you sure you want to delete <strong className="text-foreground">"{deleteTarget?.name}"</strong>?
            Movies assigned to this category will lose their category assignment.
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
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
