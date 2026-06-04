import { useEffect, useState } from "react";
import { DashboardLayout, StatCard } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { affiliatePerf } from "@/lib/mock-data";
import { MousePointerClick, UserPlus, Wallet, Percent, Copy, Loader2 } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  createdAt: string;
  subscription?: { plan?: { name: string; billing_cycle: string } };
  stripe_payment_intent_id?: string;
}

export default function AffiliatePage() {
  return (
    <Protected>
      <Affiliate />
    </Protected>
  );
}

function Affiliate() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const referralCode = user
    ? `${user.name.toLowerCase().replace(/\s+/g, "-")}-${String(user.id ?? "").slice(-4) || "user"}`
    : "user";
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copy = () => {
    navigator.clipboard?.writeText(referralLink);
    toast.success("Referral link copied");
  };

  useEffect(() => {
    api
      .get("/stripe/my-payments?limit=50")
      .then(({ data }) => setPayments(data.data.payments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const succeededPayments = payments.filter((p) => p.status === "succeeded");
  const totalEarnings = succeededPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <DashboardLayout title="Affiliate Program">
      <div className="space-y-8">
        {/* Referral link */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Your referral link</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Share this link to earn rewards when friends subscribe.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={referralLink} className="font-mono text-sm" />
            <Button onClick={copy}>
              <Copy className="mr-1 size-4" /> Copy
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Payments"
            value={String(succeededPayments.length)}
            hint="Successful transactions"
            icon={MousePointerClick}
          />
          <StatCard
            label="Active Plan"
            value={succeededPayments[0]?.subscription?.plan?.name ?? "—"}
            hint={succeededPayments[0]?.subscription?.plan?.billing_cycle ?? ""}
            icon={UserPlus}
          />
          <StatCard
            label="Total Spent"
            value={totalEarnings > 0 ? `₹${totalEarnings.toLocaleString("en-IN")}` : "₹0"}
            hint="All time"
            icon={Wallet}
          />
          <StatCard
            label="Last Payment"
            value={
              succeededPayments[0]?.paid_at
                ? new Date(succeededPayments[0].paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : "—"
            }
            hint="Most recent"
            icon={Percent}
          />
        </div>

        {/* Weekly performance (static chart — affiliate tracking not yet implemented) */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold">Weekly performance</h2>
            <Badge variant="outline" className="text-xs text-muted-foreground">Sample data</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Affiliate click &amp; referral tracking coming soon.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={affiliatePerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 270)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.68 0.012 270)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "oklch(0.26 0.014 270)" }}
                  contentStyle={{ background: "oklch(0.2 0.014 270)", border: "1px solid oklch(0.28 0.012 270)", borderRadius: 12, color: "white" }}
                />
                <Bar dataKey="clicks" fill="oklch(0.58 0.22 18)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="revenue" fill="oklch(0.7 0.16 155)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment history */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Payment History</h2>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {succeededPayments.length} transaction{succeededPayments.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No payments yet. Subscribe to a plan to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {p.subscription?.plan?.name ?? "Subscription"}
                      {p.subscription?.plan?.billing_cycle
                        ? ` · ${p.subscription.plan.billing_cycle}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.paid_at
                        ? new Date(p.paid_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : new Date(p.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {p.currency === "INR" ? "₹" : p.currency}
                      {Number(p.amount).toLocaleString("en-IN")}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        p.status === "succeeded"
                          ? "border-success/40 text-success text-xs"
                          : p.status === "failed"
                          ? "border-destructive/40 text-destructive text-xs"
                          : "border-warning/40 text-warning text-xs"
                      }
                    >
                      {p.status === "succeeded" ? "Paid" : p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
