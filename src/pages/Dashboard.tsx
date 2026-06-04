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
    api
      .get("/stripe/subscription-status")
      .then(({ data }) => setSubscription(data.data.subscription))
      .catch(() => {});

    api
      .get("/stripe/my-payments?limit=10")
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
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <DashboardLayout title={`Welcome back, ${user?.name.split(" ")[0]}`}>
      <div className="space-y-8">
        {/* Subscription banner */}
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
              <Crown className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold">{planName} Plan</h2>
                {subscription?.status === "active" && (
                  <Badge className="bg-success/20 text-success border-success/30">
                    Active
                  </Badge>
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
          <StatCard label="Hours Watched" value="—" hint="No data yet" icon={Clock} />
          <StatCard label="Next Payment" value="—" hint={renewDate !== "—" ? `Due ${renewDate}` : "No active plan"} icon={CreditCard} />
          <StatCard label="Affiliate Earnings" value="₹0" hint="No earnings yet" icon={Wallet} />
          <StatCard label="Watch Streak" value="—" hint="Start watching!" icon={TrendingUp} />
        </div>

        {/* Activity chart placeholder */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Your viewing activity</h2>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: "Jan", users: 0 },
                { month: "Feb", users: 0 },
                { month: "Mar", users: 0 },
                { month: "Apr", users: 0 },
                { month: "May", users: 0 },
                { month: "Jun", users: 0 },
              ]}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.27 14)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.62 0.27 14)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.26 0.020 260)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="oklch(0.62 0.014 260)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.15 0.020 260)",
                    border: "1px solid oklch(0.26 0.020 260)",
                    borderRadius: 10,
                    color: "white",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="oklch(0.62 0.27 14)"
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
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Continue Watching</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/browse">
                  View all <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
              {continueList.map((t) => (
                <TitleCard key={t.id} title={t} />
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent activity */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Recent Activity</h2>
            {payments.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {payments.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm">
                        Payment — {p.plan?.name ?? "Plan"} (₹{p.amount})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-4 space-y-4">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm">{a.text}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Payment history */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Payment History</h2>
            {payments.length > 0 ? (
              <div className="mt-4 space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {p.plan?.name ?? "Subscription"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{p.amount}</p>
                      <Badge
                        variant="outline"
                        className="border-success/40 text-success text-[10px]"
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No payments found. Subscribe to a plan to get started.
              </p>
            )}
          </div>
        </div>

        {/* Recommended */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recommended For You</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/library">
                Browse all <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
            {recommendedTitles.map((t) => (
              <TitleCard key={t.id} title={t} />
            ))}
          </div>
        </section>
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
