import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { DashboardLayout, StatCard } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/services/api";
import type { AppDispatch, RootState } from "@/store";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchMoviesThunk } from "@/store/slices/moviesSlice";
import { useState } from "react";
import {
  DollarSign,
  Users,
  Film,
  Tag,
  BarChart3,
  ArrowUpRight,
  Layers,
  Activity,
  CreditCard,
  Tv,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { extendedRevenueData } from "@/lib/mock-data";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  return (
    <Protected roles={["super_admin"]}>
      <Admin />
    </Protected>
  );
}

interface DashStats {
  totalUsers: number;
  activeSubscribers: number;
  totalRevenue: number;
  totalMovies: number;
}

interface AdminPayment {
  id: number;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  paid_at: string | null;
  createdAt: string;
  user?: { id: number; first_name: string; last_name: string; email: string };
  subscription?: { plan?: { name: string } };
  stripe_payment_intent_id?: string;
}

const MANAGE_CARDS = [
  {
    icon: Tag,
    title: "Categories",
    desc: "Create and manage categories that group movies for subscribers on the frontend.",
    href: "/admin/categories",
    label: "Manage Categories",
    color: "from-violet-500/20 to-violet-500/5 border-violet-500/25",
    iconBg: "bg-violet-500/15 text-violet-400",
  },
  {
    icon: Film,
    title: "Movies & Shows",
    desc: "Add, edit, publish or archive movies. Assign categories, upload thumbnails and videos.",
    href: "/admin/movies",
    label: "Manage Movies",
    color: "from-primary/20 to-primary/5 border-primary/25",
    iconBg: "bg-primary/15 text-primary",
  },
  {
    icon: Tv,
    title: "Web Series",
    desc: "Create and manage web series with multiple seasons and episodes.",
    href: "/admin/series",
    label: "Manage Series",
    color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/25",
    iconBg: "bg-cyan-500/15 text-cyan-400",
  },
  {
    icon: CreditCard,
    title: "Subscription Plans",
    desc: "Manage plans, pricing tiers, and Stripe Price ID configuration.",
    href: "/admin/plans",
    label: "Manage Plans",
    color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/25",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
];

function Admin() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: categories } = useSelector((s: RootState) => s.categories);
  const { items: movies } = useSelector((s: RootState) => s.movies);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [revenueData, setRevenueData] = useState(extendedRevenueData);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchMoviesThunk());

    apiClient
      .get("/dashboard/stats")
      .then(({ data }) => setStats(data.data.stats))
      .catch(() => {});

    apiClient
      .get("/dashboard/revenue")
      .then(({ data }) => {
        if (data.data.revenue?.length > 0) setRevenueData(data.data.revenue);
      })
      .catch(() => {});

    setPaymentsLoading(true);
    apiClient
      .get("/dashboard/payments?limit=50")
      .then(({ data }) => setPayments(data.data.payments ?? []))
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  }, [dispatch]);

  const formatRevenue = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  return (
    <DashboardLayout title="Admin Console">
      {/* Admin badge header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
          <Shield className="size-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            StreamVault Platform
          </p>
          <h1 className="text-xl font-extrabold tracking-tight">Admin Console</h1>
        </div>
        <Badge className="ml-auto bg-primary/15 text-primary border-primary/30 text-[10px] font-bold uppercase tracking-wider">
          Super Admin
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-10 rounded-xl p-1 bg-secondary/50 border border-border/60 w-full sm:w-auto sm:inline-flex">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:shadow-sm">
            <BarChart3 className="size-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="manage" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:shadow-sm">
            <Layers className="size-3.5" /> Manage
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:shadow-sm">
            <CreditCard className="size-3.5" /> Payments
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:shadow-sm">
            <Activity className="size-3.5" /> Activity
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={stats?.totalRevenue ? formatRevenue(stats.totalRevenue) : "—"}
              hint="All time"
              icon={DollarSign}
            />
            <StatCard
              label="Active Subscribers"
              value={stats?.activeSubscribers?.toLocaleString() ?? "—"}
              hint="Currently active"
              icon={Users}
            />
            <StatCard
              label="Categories"
              value={String(categories.length)}
              hint="Active categories"
              icon={Tag}
            />
            <StatCard
              label="Movies / Shows"
              value={String(movies.length)}
              hint={`${movies.filter((m) => m.status === "published").length} published`}
              icon={Film}
            />
          </div>

          {/* Revenue + Subscriber chart */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-extrabold tracking-tight">Revenue & Subscriber Growth</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Monthly trend over the last year</p>
              </div>
              <Badge variant="outline" className="text-xs text-success border-success/40 gap-1">
                <TrendingUp className="size-3" /> Live Data
              </Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="oklch(0.62 0.29 14)" />
                      <stop offset="100%" stopColor="oklch(0.72 0.22 18)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.016 258)" vertical={false} />
                  <XAxis dataKey="month" stroke="oklch(0.45 0.010 258)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.45 0.010 258)" fontSize={11} tickLine={false} axisLine={false} width={52}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.13 0.016 258)",
                      border: "1px solid oklch(0.22 0.016 258)",
                      borderRadius: 12,
                      color: "white",
                      fontSize: 12,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}
                    formatter={(v: number, name: string) => [
                      name === "revenue" ? `₹${v.toLocaleString("en-IN")}` : v.toLocaleString(),
                      name === "revenue" ? "Revenue" : "Subscribers",
                    ]}
                  />
                  <Legend
                    formatter={(v) => (v === "revenue" ? "Revenue" : "Subscribers")}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="oklch(0.62 0.29 14)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="users" stroke="oklch(0.72 0.18 155)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Signups bar chart */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <div className="mb-6">
              <h2 className="font-extrabold tracking-tight">New Signups by Month</h2>
              <p className="text-xs text-muted-foreground mt-0.5">User acquisition trend</p>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.016 258)" vertical={false} />
                  <XAxis dataKey="month" stroke="oklch(0.45 0.010 258)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "oklch(0.18 0.014 258)" }}
                    contentStyle={{
                      background: "oklch(0.13 0.016 258)",
                      border: "1px solid oklch(0.22 0.016 258)",
                      borderRadius: 12,
                      color: "white",
                      fontSize: 12,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}
                  />
                  <Bar dataKey="newUsers" name="New Signups" fill="oklch(0.62 0.29 14)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Zap, label: "Published Content", value: `${movies.filter((m) => m.status === "published").length} titles`, color: "text-yellow-400 bg-yellow-400/10" },
              { icon: Users, label: "Total Users", value: stats?.totalUsers?.toLocaleString() ?? "—", color: "text-cyan-400 bg-cyan-400/10" },
              { icon: ArrowUpRight, label: "Conversion Rate", value: stats?.totalUsers ? `${((stats.activeSubscribers / stats.totalUsers) * 100).toFixed(1)}%` : "—", color: "text-emerald-400 bg-emerald-400/10" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5">
                <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-xl font-extrabold tracking-tight mt-0.5">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Manage ── */}
        <TabsContent value="manage" className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {MANAGE_CARDS.map((card) => {
              const count = card.href === "/admin/categories"
                ? `${categories.length} total · ${categories.filter((c) => c.status === "active").length} active`
                : card.href === "/admin/movies"
                ? `${movies.length} total · ${movies.filter((m) => m.status === "published").length} published`
                : "";
              return (
                <div
                  key={card.title}
                  className={`group relative flex flex-col rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5)] ${card.color}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                      <card.icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-extrabold text-base">{card.title}</h2>
                      {count && <p className="text-xs text-muted-foreground mt-0.5">{count}</p>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">{card.desc}</p>
                  <Button asChild className="w-full rounded-xl h-10 font-bold text-sm">
                    <Link to={card.href} className="flex items-center gap-1.5">
                      {card.label}
                      <ArrowUpRight className="size-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Recent movies preview */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <h2 className="font-extrabold tracking-tight">Recent Movies</h2>
              <Button variant="ghost" size="sm" asChild className="text-xs rounded-lg">
                <Link to="/admin/movies" className="flex items-center gap-1">
                  View all <ArrowUpRight className="size-3" />
                </Link>
              </Button>
            </div>
            {movies.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <Film className="size-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium">No movies yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <Link to="/admin/movies" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                    Add your first movie →
                  </Link>
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {movies.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-secondary/20 transition-colors">
                    <div>
                      <p className="text-sm font-semibold">{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.category?.name ?? "No category"}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        m.status === "published"
                          ? "border-success/40 text-success bg-success/10"
                          : m.status === "draft"
                          ? "border-warning/40 text-warning bg-warning/10"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Payments ── */}
        <TabsContent value="payments" className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div>
                <h2 className="font-extrabold tracking-tight">Payment Transactions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">All payment records from Stripe</p>
              </div>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {payments.length} records
              </Badge>
            </div>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <CreditCard className="size-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium">No payment records yet</p>
                <p className="text-xs text-muted-foreground mt-1">Payments appear here after a successful Stripe checkout.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left">
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">User</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Plan</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Amount</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Status</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Date</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 hidden lg:table-cell">Payment Intent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-sm">{p.user ? `${p.user.first_name} ${p.user.last_name}` : "—"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.user?.email ?? ""}</p>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-muted-foreground">
                          {p.subscription?.plan?.name ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-sm">
                          {p.currency === "INR" ? "₹" : p.currency}{Number(p.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              p.status === "succeeded"
                                ? "border-success/40 text-success bg-success/10"
                                : p.status === "failed"
                                ? "border-destructive/40 text-destructive bg-destructive/10"
                                : "border-warning/40 text-warning bg-warning/10"
                            }`}
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-muted-foreground">
                          {p.paid_at
                            ? new Date(p.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-3.5 hidden lg:table-cell">
                          <code className="text-[11px] font-mono text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-md">
                            {p.stripe_payment_intent_id ? p.stripe_payment_intent_id.slice(0, 24) + "…" : "—"}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Activity ── */}
        <TabsContent value="activity" className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <div className="mb-6">
              <h2 className="font-extrabold tracking-tight">Payment Activity Feed</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Recent payment events in real-time</p>
            </div>
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                  <Activity className="size-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">Payment events will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {payments.slice(0, 10).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-4 rounded-xl border border-border/50 bg-secondary/15 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`mt-0.5 size-2.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-card ${p.status === "succeeded" ? "bg-success ring-success/30" : "bg-destructive ring-destructive/30"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {p.status === "succeeded" ? "Payment received" : "Payment failed"}{" "}
                        <span className="text-muted-foreground font-normal">—{" "}
                          {p.user ? `${p.user.first_name} ${p.user.last_name}` : "Unknown"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.subscription?.plan?.name ?? "Plan"} ·{" "}
                        {p.currency === "INR" ? "₹" : p.currency}{Number(p.amount).toLocaleString("en-IN")} ·{" "}
                        {p.paid_at
                          ? new Date(p.paid_at).toLocaleString("en-IN")
                          : new Date(p.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${
                        p.status === "succeeded"
                          ? "border-success/40 text-success bg-success/10"
                          : "border-destructive/40 text-destructive bg-destructive/10"
                      }`}
                    >
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
