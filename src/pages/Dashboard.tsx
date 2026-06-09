import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { DashboardLayout, StatCard } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import { TitleCard } from "@/components/streaming/TitleCard";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { recentActivity, type Title } from "@/lib/mock-data";
import { fetchMovies } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Clock,
  TrendingUp,
  Wallet,
  Crown,
  ArrowRight,
  Sparkles,
  Play,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SubscriptionStatus {
  status?: string;
  plan?: { name: string };
  end_date?: string;
  stripe_subscription_id?: string;
}

interface Payment {
  id: number;
  stripe_session_id?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  plan?: { name: string; billing_cycle: string };
}

function DashboardInner() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [recommendedTitles, setRecommendedTitles] = useState<Title[]>([]);
  const [continueList, setContinueList] = useState<Title[]>([]);

  useEffect(() => {
    api.get("/stripe/subscription-status")
      .then(({ data }) => setSubscription(data.data.subscription))
      .catch(() => {});
    api.get("/stripe/my-payments?limit=10")
      .then(({ data }) => setPayments(data.data.payments ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMovies({ status: "published", limit: 10 })
      .then((data) => {
        setRecommendedTitles(data.slice(0, 8));
        setContinueList(data.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  const planName = subscription?.plan?.name ?? user?.plan ?? "Standard";
  const renewDate = subscription?.end_date
    ? new Date(subscription.end_date).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  const isActive = subscription?.status === "active";

  return (
    <DashboardLayout title={`Welcome back, ${user?.name.split(" ")[0]}`}>
      <div className="space-y-8">

        {/* Subscription hero card */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent p-6">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary/12 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow-sm">
                <Crown className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold tracking-tight">{planName} Plan</h2>
                  {isActive && (
                    <Badge className="bg-success/15 text-success border-success/30 text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {subscription?.end_date ? `Renews ${renewDate}` : "Manage your subscription anytime"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="secondary" size="sm" asChild className="rounded-xl">
                <Link to="/pricing" className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5" /> Manage Plan
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Hours Watched" value="—" hint="Start watching to track" icon={Clock} />
          <StatCard
            label="Next Payment"
            value="—"
            hint={renewDate !== "—" ? `Due ${renewDate}` : "No active plan"}
            icon={CreditCard}
          />
          <StatCard label="Affiliate Earnings" value="₹0" hint="Invite friends to earn" icon={Wallet} />
          <StatCard label="Watch Streak" value="—" hint="Keep streaming daily" icon={TrendingUp} />
        </div>

        {/* Activity chart */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-extrabold tracking-tight">Viewing Activity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your watch history over the last 6 months</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: "Jan", hours: 0 },
                { month: "Feb", hours: 0 },
                { month: "Mar", hours: 0 },
                { month: "Apr", hours: 0 },
                { month: "May", hours: 0 },
                { month: "Jun", hours: 0 },
              ]}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.29 14)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="oklch(0.62 0.29 14)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.016 258)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="oklch(0.50 0.010 258)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.13 0.016 258)",
                    border: "1px solid oklch(0.22 0.016 258)",
                    borderRadius: 12,
                    color: "white",
                    fontSize: 12,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="oklch(0.62 0.29 14)"
                  strokeWidth={2}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Continue watching */}
        {continueList.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                  <Play className="size-4 text-primary fill-primary" />
                  Continue Watching
                </h2>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground rounded-lg">
                <Link to="/browse" className="flex items-center gap-1">
                  View all <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
              {continueList.map((t) => <TitleCard key={t.id} title={t} />)}
            </div>
          </section>
        )}

        {/* Activity + payments grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent activity */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h2 className="font-extrabold tracking-tight mb-5">Recent Activity</h2>
            {payments.length > 0 ? (
              <ul className="space-y-4">
                {payments.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Payment — {p.plan?.name ?? "Plan"} (₹{p.amount})</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-success/30 text-success text-[10px] shrink-0">
                      {p.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-4">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-primary/60" />
                    <div>
                      <p className="text-sm">{a.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Payment history */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h2 className="font-extrabold tracking-tight mb-5">Payment History</h2>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold">{p.plan?.name ?? "Subscription"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold">₹{p.amount}</p>
                      <Badge variant="outline" className="border-success/30 text-success text-[10px] mt-0.5">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <CreditCard className="size-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium">No payments yet</p>
                <p className="text-xs text-muted-foreground mt-1">Subscribe to a plan to get started.</p>
                <Button size="sm" asChild className="mt-4 rounded-xl shadow-glow-sm">
                  <Link to="/pricing">View Plans</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recommended */}
        {recommendedTitles.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                  <Sparkles className="size-4 text-warning" />
                  Recommended For You
                </h2>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground rounded-lg">
                <Link to="/library" className="flex items-center gap-1">
                  Browse all <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
              {recommendedTitles.map((t) => <TitleCard key={t.id} title={t} />)}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function Dashboard() {
  return (
    <Protected>
      <DashboardInner />
    </Protected>
  );
}
