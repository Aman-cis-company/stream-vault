import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/components/streaming/Navbar";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Users2, User, Shield, CreditCard } from "lucide-react";

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
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {items.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <n.icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <div className="mt-6">{children}</div>
        </div>
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
    <div className="group relative rounded-2xl border border-border/70 bg-card p-5 shadow-card transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      <div className="relative flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-all group-hover:bg-primary/20 group-hover:ring-primary/35">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="relative mt-3 text-2xl font-bold tracking-tight">{value}</p>
      {hint && (
        <p className={`relative mt-1 text-xs font-medium ${trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
