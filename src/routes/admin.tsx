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

  console.log("stats?.totalRevenue",stats?.totalRevenue);
  console.log(stats?.totalRevenue ? `₹${(stats.totalRevenue / 100000).toFixed(1)}L` : "—");
  const formatRevenue = (amount: number) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};

  return (
    <DashboardLayout title="Admin Console">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="size-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-1.5">
            <Layers className="size-4" /> Manage
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <CreditCard className="size-4" /> Payments
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <Activity className="size-4" /> Activity
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

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Revenue & Subscriber Growth</h2>
              <Badge variant="outline" className="text-xs text-success border-success/40">
                <ArrowUpRight className="size-3 mr-0.5" /> Live
              </Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 270)" vertical={false} />
                  <XAxis dataKey="month" stroke="oklch(0.68 0.012 270)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.68 0.012 270)" fontSize={11} tickLine={false} axisLine={false} width={48}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.2 0.014 270)", border: "1px solid oklch(0.28 0.012 270)", borderRadius: 12, color: "white", fontSize: 12 }}
                    formatter={(v: number, name: string) => [
                      name === "revenue" ? `₹${v.toLocaleString("en-IN")}` : v.toLocaleString(),
                      name === "revenue" ? "Revenue" : "Subscribers",
                    ]}
                  />
                  <Legend formatter={(v) => (v === "revenue" ? "Revenue" : "Subscribers")} />
                  <Line type="monotone" dataKey="revenue" stroke="oklch(0.58 0.22 18)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="users" stroke="oklch(0.7 0.16 155)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">New Signups by Month</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 270)" vertical={false} />
                  <XAxis dataKey="month" stroke="oklch(0.68 0.012 270)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "oklch(0.26 0.014 270)" }}
                    contentStyle={{ background: "oklch(0.2 0.014 270)", border: "1px solid oklch(0.28 0.012 270)", borderRadius: 12, color: "white", fontSize: 12 }} />
                  <Bar dataKey="newUsers" name="New Signups" fill="oklch(0.58 0.22 18)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ── Manage ── */}
        <TabsContent value="manage" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Categories card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Tag className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Categories</h2>
                  <p className="text-xs text-muted-foreground">
                    {categories.length} total · {categories.filter((c) => c.status === "active").length} active
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Create and manage categories. Categories appear automatically on the frontend and group movies for subscribers.
              </p>
              <Button asChild className="w-full">
                <Link to="/admin/categories">Manage Categories</Link>
              </Button>
            </div>

            {/* Movies card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Film className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Movies & Shows</h2>
                  <p className="text-xs text-muted-foreground">
                    {movies.length} total · {movies.filter((m) => m.status === "published").length} published
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Add, edit, publish or archive movies and shows. Assign categories, upload thumbnails and videos or link external sources.
              </p>
              <Button asChild className="w-full">
                <Link to="/admin/movies">Manage Movies</Link>
              </Button>
            </div>

            {/* Web Series card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Tv className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Web Series</h2>
                  <p className="text-xs text-muted-foreground">Manage series and episodes</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Create and manage web series with multiple seasons and episodes. Upload videos per episode.
              </p>
              <Button asChild className="w-full">
                <Link to="/admin/series">Manage Series</Link>
              </Button>
            </div>

            {/* Subscription Plans card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <CreditCard className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Subscription Plans</h2>
                  <p className="text-xs text-muted-foreground">
                    Configure Stripe Price IDs for each plan
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage subscription plans, pricing, and Stripe integration. Set or update Stripe Price IDs to enable payments.
              </p>
              <Button asChild className="w-full">
                <Link to="/admin/plans">Manage Plans</Link>
              </Button>
            </div>
          </div>

          {/* Recent movies */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Recent Movies</h2>
            {movies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No movies yet. <Link to="/admin/movies" className="text-primary hover:underline">Add your first movie →</Link>
              </p>
            ) : (
              <div className="space-y-2">
                {movies.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div>
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.category?.name ?? "No category"}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
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
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <p className="font-semibold">Payment Transactions</p>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {payments.length} records
              </Badge>
            </div>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : payments.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                No payment records yet. Payments appear here after a successful Stripe checkout.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-6 py-3 font-medium">Plan</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium hidden lg:table-cell">Payment Intent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-medium">{p.user ? `${p.user.first_name} ${p.user.last_name}` : "—"}</p>
                          <p className="text-xs text-muted-foreground">{p.user?.email ?? ""}</p>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {p.subscription?.plan?.name ?? "—"}
                        </td>
                        <td className="px-6 py-3 font-semibold">
                          {p.currency === "INR" ? "₹" : p.currency}{Number(p.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-3">
                          <Badge
                            variant="outline"
                            className={
                              p.status === "succeeded"
                                ? "border-success/40 text-success bg-success/10 text-xs"
                                : p.status === "failed"
                                ? "border-destructive/40 text-destructive bg-destructive/10 text-xs"
                                : "border-warning/40 text-warning bg-warning/10 text-xs"
                            }
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground text-xs">
                          {p.paid_at
                            ? new Date(p.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-3 hidden lg:table-cell">
                          <code className="text-xs font-mono text-muted-foreground">
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
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Recent Payments Activity</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-start gap-4 rounded-lg border border-border/60 bg-secondary/20 p-4">
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${p.status === "succeeded" ? "bg-success" : "bg-destructive"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {p.status === "succeeded" ? "Payment received" : "Payment failed"} —{" "}
                        {p.user ? `${p.user.first_name} ${p.user.last_name}` : "Unknown"}{" "}
                        ({p.subscription?.plan?.name ?? "Plan"} · {p.currency === "INR" ? "₹" : p.currency}{Number(p.amount).toLocaleString("en-IN")})
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.paid_at
                          ? new Date(p.paid_at).toLocaleString("en-IN")
                          : new Date(p.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
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
