import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
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
import { Pencil, Loader2, ArrowLeft, CheckCircle2, XCircle, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminPlans() {
  return (
    <Protected roles={["super_admin", "admin", "finance_manager"]}>
      <PlansPage />
    </Protected>
  );
}

interface Plan {
  id: number;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  billing_cycle: "monthly" | "yearly";
  stripe_price_id: string | null;
  features_json: string[] | null;
  status: "active" | "inactive";
}

interface PlanForm {
  name: string;
  description: string;
  price: string;
  billing_cycle: "monthly" | "yearly";
  stripe_price_id: string;
  status: "active" | "inactive";
}

function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>({
    name: "",
    description: "",
    price: "",
    billing_cycle: "monthly",
    stripe_price_id: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/stripe/plans/all");
      setPlans(data.data.plans);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      price: String(plan.price),
      billing_cycle: plan.billing_cycle,
      stripe_price_id: plan.stripe_price_id ?? "",
      status: plan.status,
    });
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        billing_cycle: form.billing_cycle,
        stripe_price_id: form.stripe_price_id.trim() || null,
        status: form.status,
      };
      const { data } = await apiClient.put(`/stripe/plans/${editing.id}`, payload);
      setPlans((prev) => prev.map((p) => (p.id === editing.id ? data.data.plan : p)));
      toast.success("Plan updated");
      setEditing(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to update plan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout title="Subscription Plans">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-lg">
            <Link to="/admin">
              <ArrowLeft className="mr-1 size-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
          <div className="flex items-start gap-4 border-b border-border/60 px-6 py-4">
            <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 mt-0.5">
              <CreditCard className="size-4.5" />
            </div>
            <div>
              <h2 className="font-extrabold tracking-tight">Subscription Plans</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set the Stripe Price ID for each plan to enable payments. Leave blank to auto-create via Stripe API on first checkout.
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
                  <tr className="border-b border-border/60 text-left">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Plan</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Price</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Billing</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Stripe Price ID</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Status</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {plans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium">{plan.name}</p>
                        {plan.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {plan.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        ₹{Number(plan.price).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground capitalize">
                        {plan.billing_cycle}
                      </td>
                      <td className="px-6 py-4">
                        {plan.stripe_price_id ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-success shrink-0" />
                            <code className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                              {plan.stripe_price_id}
                            </code>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-warning">
                            <XCircle className="size-3.5 shrink-0" />
                            <span className="text-xs">Not set — will auto-create on first checkout</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={
                            plan.status === "active"
                              ? "border-success/40 text-success bg-success/10 text-xs"
                              : "border-muted-foreground/30 text-muted-foreground text-xs"
                          }
                        >
                          {plan.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(plan)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 text-sm text-muted-foreground space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-primary" />
            <p className="font-extrabold text-foreground text-sm">How Stripe Price IDs work</p>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed pl-2">
            <li>Go to your <strong className="text-foreground">Stripe Dashboard → Products</strong> and create a product for each plan.</li>
            <li>Under each product, add a recurring price matching the plan's amount and billing cycle.</li>
            <li>Copy the <strong className="text-foreground">Price ID</strong> (starts with <code className="font-mono bg-secondary/60 px-1.5 py-0.5 rounded text-[11px]">price_</code>) and paste it above.</li>
            <li><strong className="text-foreground">Or</strong> leave it blank — the system will auto-create a product and price in Stripe on the first checkout attempt.</li>
          </ol>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !saving && !o && setEditing(null)}>
        <DialogContent className="max-w-lg rounded-2xl border-border/60 bg-[oklch(0.11_0.016_258)]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="inline-flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <CreditCard className="size-4.5" />
              </div>
              <DialogTitle className="font-extrabold">Edit Plan — {editing?.name}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select
                  value={form.billing_cycle}
                  onValueChange={(v) =>
                    setForm({ ...form, billing_cycle: v as "monthly" | "yearly" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Stripe Price ID{" "}
                <span className="text-muted-foreground font-normal text-xs">(optional — leave blank to auto-create)</span>
              </Label>
              <Input
                value={form.stripe_price_id}
                onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })}
                placeholder="price_1abc..."
                className="font-mono text-sm"
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
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
