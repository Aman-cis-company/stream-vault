import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/components/streaming/Navbar";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users2,
  User,
  Shield,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/affiliate", label: "Affiliate", icon: Users2 },
  { to: "/profile", label: "Profile & Security", icon: User },
] as const;

export function DashboardLayout({ children, title }: { children: ReactNode; title: string }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const items = [
    ...NAV,
    ...(user?.role === "admin" ? [{ to: "/admin" as const, label: "Admin Console", icon: Shield }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-0.5">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
              Navigation
            </p>
            {items.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-primary/12 text-primary border border-primary/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }`}
                >
                  <n.icon className={`size-4 shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                  {n.label}
                  {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                </Link>
              );
            })}

            {/* Subscription card in sidebar */}
            <div className="mt-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
              <p className="text-xs font-semibold text-primary">Upgrade Plan</p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                Get 4K Ultra HD, Dolby Atmos &amp; more screens.
              </p>
              <Link
                to="/pricing"
                className="mt-3 flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
              >
                View plans <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof CreditCard;
  trend?: "up" | "down";
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-all duration-300 hover:border-primary/25 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]">
      {/* Subtle gradient reveal on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">{label}</p>
          <p className="mt-2.5 text-2xl font-extrabold tracking-tight">{value}</p>
          {hint && (
            <p className={`mt-1 text-xs font-medium flex items-center gap-1 ${
              trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {trend === "up" && <TrendingUp className="size-3" />}
              {hint}
            </p>
          )}
        </div>
        <span className="ml-3 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all group-hover:bg-primary/18 group-hover:ring-primary/35">
          <Icon className="size-4.5" />
        </span>
      </div>
    </div>
  );
}
