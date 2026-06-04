import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { DashboardLayout, StatCard } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import { TitleCard } from "@/components/streaming/TitleCard";
import { useAuth } from "@/lib/auth";
import { recentActivity, paymentHistory, revenueData } from "@/lib/mock-data";
import { fetchMovies } from "@/lib/movies";
import type { Title } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Clock, TrendingUp, Wallet, Crown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";

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

  useEffect(() => {
    fetchMovies({ status: "published", limit: 10 })
      .then(setRecommended)
      .catch(() => {});
  }, []);

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
                <h2 className="font-semibold">{user?.plan} Plan</h2>
                <Badge className="bg-success text-success-foreground">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Renews on June 1, 2025 · 4K Ultra HD</p>
            </div>
          </div>
          <Button variant="secondary" asChild>
            <Link to="/pricing">Manage Plan</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Hours Watched" value="142h" hint="+12h this month" icon={Clock} />
          <StatCard label="Next Payment" value="₹749" hint="Due Jun 1" icon={CreditCard} />
          <StatCard label="Affiliate Earnings" value="₹1,44,468" hint="+₹10,360 this week" icon={Wallet} />
          <StatCard label="Watch Streak" value="9 days" hint="Keep it up!" icon={TrendingUp} />
        </div>

        {/* Activity chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Your viewing activity</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.58 0.22 18)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.58 0.22 18)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 270)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.68 0.012 270)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.2 0.014 270)",
                    border: "1px solid oklch(0.28 0.012 270)",
                    borderRadius: 12,
                    color: "white",
                  }}
                />
                <Area type="monotone" dataKey="users" stroke="oklch(0.58 0.22 18)" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommended / Continue watching */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Continue Watching</h2>
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
          </div>

          {/* Payment history */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">Payment History</h2>
            <div className="mt-4 space-y-3">
              {paymentHistory.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{p.plan}</p>
                    <p className="text-xs text-muted-foreground">{p.date} · {p.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">₹{p.amount.toLocaleString("en-IN")}</p>
                    <Badge variant="outline" className="border-success/40 text-success">{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recommended For You</h2>
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
