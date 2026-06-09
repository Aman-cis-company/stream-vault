import { useEffect, useState } from "react";
import { DashboardLayout, StatCard } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick, UserPlus, Wallet, TrendingUp, Copy, Loader2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

interface AffiliateStats {
  totalClicks: number;
  totalReferrals: number;
  confirmedReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  recentConversions: Conversion[];
}

interface Conversion {
  id: number;
  referredUser: { name: string; email: string; joinedAt: string } | null;
  planName: string | null;
  commissionAmount: number;
  status: "pending" | "confirmed" | "paid";
  date: string;
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
  const [code, setCode] = useState<string>("");
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);

  const referralLink = code ? `${window.location.origin}/signup?ref=${code}` : "";

  useEffect(() => {
    Promise.all([
      api.get("/affiliate/code"),
      api.get("/affiliate/stats"),
    ])
      .then(([codeRes, statsRes]) => {
        setCode(codeRes.data.data.code);
        setStats(statsRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copy = () => {
    if (!referralLink) return;
    navigator.clipboard?.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const statusBadge = (status: Conversion["status"]) => {
    if (status === "confirmed" || status === "paid")
      return <Badge className="bg-success/20 text-success border-success/30 text-[10px]">Confirmed</Badge>;
    return <Badge variant="outline" className="border-yellow-500/40 text-yellow-500 text-[10px]">Pending</Badge>;
  };

  return (
    <DashboardLayout title="Affiliate Program">
      <div className="space-y-8">
        {/* Referral link */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Your referral link</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Share this link to earn {(10).toFixed(0)}% commission when friends subscribe. Commission is credited automatically on their first payment.
          </p>
          {loading ? (
            <div className="flex items-center gap-2 h-10">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Generating your code...</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input readOnly value={referralLink} className="font-mono text-sm" />
              <Button onClick={copy}>
                <Copy className="mr-1.5 size-4" /> Copy
              </Button>
            </div>
          )}
          {code && (
            <p className="mt-2 text-xs text-muted-foreground">
              Your code: <span className="font-mono text-foreground font-medium">{code}</span>
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-24" />
            ))
          ) : (
            <>
              <StatCard
                label="Link Clicks"
                value={String(stats?.totalClicks ?? 0)}
                hint="Times your link was visited"
                icon={MousePointerClick}
              />
              <StatCard
                label="Referrals"
                value={`${stats?.confirmedReferrals ?? 0} / ${stats?.totalReferrals ?? 0}`}
                hint="Confirmed / Total sign-ups"
                icon={UserPlus}
              />
              <StatCard
                label="Total Earned"
                value={stats && stats.totalEarnings > 0 ? `₹${Number(stats.totalEarnings).toLocaleString("en-IN")}` : "₹0"}
                hint="Confirmed commissions"
                icon={Wallet}
              />
              <StatCard
                label="Pending"
                value={stats && stats.pendingEarnings > 0 ? `₹${Number(stats.pendingEarnings).toLocaleString("en-IN")}` : "₹0"}
                hint="Awaiting first payment"
                icon={TrendingUp}
              />
            </>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: "1", title: "Share your link", desc: "Copy your unique referral link and share it on social media, blogs, or with friends." },
              { step: "2", title: "Friend signs up", desc: "When someone clicks your link and creates an account, they're attributed to you automatically." },
              { step: "3", title: "Earn commission", desc: "Once they complete their first payment, you earn 10% commission credited to your account." },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">{item.step}</span>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent conversions */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Referrals</h2>
            {stats && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {stats.totalReferrals} total
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !stats || stats.recentConversions.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <UserPlus className="size-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No referrals yet. Share your link to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentConversions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                      {c.referredUser?.name.charAt(0).toUpperCase() ?? "?"}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{c.referredUser?.name ?? "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {c.planName ? ` · ${c.planName}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {c.commissionAmount > 0 ? `₹${Number(c.commissionAmount).toLocaleString("en-IN")}` : "—"}
                    </p>
                    {statusBadge(c.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout info */}
        <div className="rounded-xl border border-border bg-card/50 p-5 flex gap-3">
          <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="font-medium text-sm">Commission rate: 10% per confirmed referral</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Commission is automatically confirmed when a referred user completes their first subscription payment.
              Payouts are processed at the end of each month. Contact support to set up your payout details.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
