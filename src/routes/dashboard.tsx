import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { DashboardLayout, StatCard } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import { TitleCard } from "@/components/streaming/TitleCard";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fetchMovies } from "@/lib/movies";
import type { Title } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Clock, TrendingUp, Wallet, Crown, ArrowRight, Loader2 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface UserStats {
  hoursWatched: number;
  watchStreak: number;
  affiliateEarnings: number;
  nextPayment: { amount: number; dueDate: string; planName: string } | null;
}

interface ActivityPoint {
  month: string;
  minutes: number;
  sessions: number;
}

interface RecentActivityItem {
  id: number;
  text: string;
  time: string;
  completionPercentage: number;
  watchTimeSec: number;
}

interface SubscriptionStatus {
  status?: string;
  plan?: { name: string };
  end_date?: string;
}

interface Payment {
  id: number;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paid_at?: string | null;
  subscription?: { plan?: { name: string; billing_cycle: string } };
}

export default function DashboardPage() {
  return (
    <Protected>
      <Dashboard />
    </Protected>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [recommended, setRecommended] = useState<Title[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchMovies({ status: "published", limit: 10 })
      .then(setRecommended)
      .catch(() => {});

    api.get("/stripe/subscription-status")
      .then(({ data }) => setSubscription(data.data.subscription))
      .catch(() => {});

    api.get("/stripe/my-payments?limit=10")
      .then(({ data }) => setPayments(data.data.payments ?? []))
      .catch(() => {});

    Promise.all([
      api.get("/user/stats"),
      api.get("/user/watch-activity"),
      api.get("/user/recent-activity?limit=5"),
    ])
      .then(([statsRes, activityRes, recentRes]) => {
        setStats(statsRes.data.data);
        setActivity(activityRes.data.data.activity ?? []);
        setRecentActivity(recentRes.data.data.activity ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const planName = subscription?.plan?.name ?? user?.plan ?? "Standard";
  const renewDate = subscription?.end_date
    ? new Date(subscription.end_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : stats?.nextPayment?.dueDate
    ? new Date(stats.nextPayment.dueDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <DashboardLayout title={`Welcome back, ${user?.name.split(" ")[0]} 👋`}>
      <div className="space-y-8">
        {/* Subscription banner */}
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/15 to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
              <Crown className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{planName} Plan</h2>
                {subscription?.status === "active" && (
                  <Badge className="bg-success text-success-foreground">Active</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {subscription?.end_date ? `Renews on ${renewDate}` : "Manage your subscription"}
              </p>
            </div>
          </div>
          <Button variant="secondary" asChild>
            <Link to="/pricing">Manage Plan</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 flex items-center gap-3 animate-pulse">
                <div className="size-10 rounded-lg bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-5 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard
                label="Hours Watched"
                value={stats ? `${stats.hoursWatched}h` : "0h"}
                hint={stats && stats.hoursWatched > 0 ? "Total watch time" : "Start watching!"}
                icon={Clock}
              />
              <StatCard
                label="Next Payment"
                value={stats?.nextPayment ? `₹${Number(stats.nextPayment.amount).toLocaleString("en-IN")}` : "—"}
                hint={renewDate !== "—" ? `Due ${renewDate}` : "No active plan"}
                icon={CreditCard}
              />
              <StatCard
                label="Affiliate Earnings"
                value={stats ? `₹${Number(stats.affiliateEarnings).toLocaleString("en-IN")}` : "₹0"}
                hint={stats && stats.affiliateEarnings > 0 ? "Total lifetime earnings" : "No earnings yet"}
                icon={Wallet}
              />
              <StatCard
                label="Watch Streak"
                value={stats ? `${stats.watchStreak} day${stats.watchStreak !== 1 ? "s" : ""}` : "0 days"}
                hint={stats && stats.watchStreak > 0 ? "Keep it up!" : "Start watching!"}
                icon={TrendingUp}
              />
            </>
          )}
        </div>

        {/* Activity chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Your viewing activity</h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">Minutes watched per month (last 12 months)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity.length > 0 ? activity : Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (11 - i));
                return { month: d.toLocaleString("en-IN", { month: "short" }), minutes: 0, sessions: 0 };
              })}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.22 18)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.58 0.22 18)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 270)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.68 0.012 270)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.68 0.012 270)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}m`} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.2 0.014 270)",
                    border: "1px solid oklch(0.28 0.012 270)",
                    borderRadius: 12,
                    color: "white",
                  }}
                  formatter={(value: number) => [`${value} min`, "Watched"]}
                />
                <Area type="monotone" dataKey="minutes" stroke="oklch(0.58 0.22 18)" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Continue watching */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Continue Watching</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/browse">View all <ArrowRight className="ml-1 size-3.5" /></Link>
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
            {recommended.slice(0, 5).map((t) => (
              <TitleCard key={t.id} title={t} />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent activity */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">Recent Activity</h2>
            {loadingStats ? (
              <div className="mt-4 flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentActivity.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{a.text}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                        {a.completionPercentage > 0 && (
                          <span className="text-xs text-muted-foreground">
                            · {Math.round(a.completionPercentage)}% watched
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No activity yet. Start watching!</p>
            )}
          </div>

          {/* Payment history */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">Payment History</h2>
            {payments.length > 0 ? (
              <div className="mt-4 space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{p.subscription?.plan?.name ?? "Subscription"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.paid_at ?? p.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {p.currency === "INR" ? "₹" : p.currency}{Number(p.amount).toLocaleString("en-IN")}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          p.status === "succeeded"
                            ? "border-success/40 text-success text-[10px]"
                            : p.status === "failed"
                            ? "border-destructive/40 text-destructive text-[10px]"
                            : "border-yellow-500/40 text-yellow-500 text-[10px]"
                        }
                      >
                        {p.status === "succeeded" ? "Paid" : p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No payments yet. Subscribe to a plan to get started.</p>
            )}
          </div>
        </div>

        {/* Recommended */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recommended For You</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/library">Browse all <ArrowRight className="ml-1 size-3.5" /></Link>
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
            {recommended.map((t) => (
              <TitleCard key={t.id} title={t} />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
