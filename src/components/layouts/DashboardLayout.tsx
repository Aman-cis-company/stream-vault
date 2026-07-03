import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "@/components/streaming/Navbar";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users2,
  User,
  Shield,
  Lock,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  Tag,
  Film,
  Tv,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Receipt,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/affiliate", label: "Affiliate", icon: Users2 },
  { to: "/profile", label: "Profile & Security", icon: User },
  { to: "/profile?tab=billing", label: "Billing & Invoices", icon: CreditCard },
  { to: "/settings/parental-controls", label: "Parental Controls", icon: Lock },
];

export function DashboardLayout({ children, title }: { children: ReactNode; title: string }) {
  const location = useLocation();
  const { pathname, search } = location;
  const { user } = useAuth();
  
  const isAdmin = pathname.startsWith("/admin");

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sv_admin_sidebar_collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("sv_admin_sidebar_collapsed", JSON.stringify(next));
      return next;
    });
  };

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const ROLE_PERMISSIONS: Record<string, string[]> = {
    super_admin: ["reports:read", "movies:read", "movies:write", "episodes:read", "episodes:write", "subscriptions:read", "invoices:read", "invoices:write", "team:read", "team:write", "users:read", "users:write"],
    admin: ["reports:read", "movies:read", "movies:write", "episodes:read", "episodes:write", "subscriptions:read", "invoices:read", "invoices:write", "users:read", "users:write"],
    content_manager: ["movies:read", "movies:write", "episodes:read", "episodes:write", "reports:read"],
    finance_manager: ["subscriptions:read", "invoices:read", "invoices:write", "reports:read"],
    affiliate_manager: ["affiliates:read", "affiliates:write", "reports:read"],
    support_agent: ["users:read", "users:write", "reports:read"],
  };

  const hasConsoleAccess = user?.role && user.role !== "subscriber" && user.role !== "affiliate";

  const allAdminItems = [
    { to: "/admin" as const, label: "Overview", icon: Shield, permission: "reports:read" },
    { to: "/admin/categories" as const, label: "Categories", icon: Tag, permission: "movies:write" },
    { to: "/admin/movies" as const, label: "Movies & Shows", icon: Film, permission: "movies:read" },
    { to: "/admin/series" as const, label: "Web Series", icon: Tv, permission: "episodes:read" },
    { to: "/admin/plans" as const, label: "Subscription Plans", icon: CreditCard, permission: "subscriptions:read" },
    { to: "/admin/billing" as const, label: "Billing Management", icon: Receipt, permission: "invoices:read" },
    { to: "/admin/team" as const, label: "Team Management", icon: Users2, permission: "team:read" },
  ];

  const adminItems = allAdminItems.filter(item => {
    if (user?.role === "super_admin") return true;
    const permissions = ROLE_PERMISSIONS[user?.role ?? ""] ?? [];
    return permissions.includes(item.permission);
  });

  const items = isAdmin
    ? adminItems
    : [
        ...NAV,
        ...(hasConsoleAccess
          ? [{ to: "/admin" as const, label: "Admin Console", icon: Shield }]
          : []),
      ];

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Navbar />
      
      <div className={`w-full flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8 grid transition-all duration-300 ${
        isCollapsed ? "lg:grid-cols-[68px_1fr]" : "lg:grid-cols-[240px_1fr]"
      }`}>

        {/* Sidebar */}
        <aside className={`hidden lg:block transition-all duration-300 ${isCollapsed ? "w-[68px]" : "w-[240px]"}`}>
          <nav className="sticky top-24 space-y-0.5">
            <div className={`flex items-center mb-5 ${isCollapsed ? "justify-center" : "justify-between px-3.5"}`}>
              {!isCollapsed && (
                <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground/70">
                  {isAdmin ? "Admin Console" : "Navigation"}
                </span>
              )}
              <button
                onClick={toggleCollapse}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-foreground/5 text-foreground/50 hover:text-foreground hover:bg-foreground/10 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/45 dark:hover:text-white dark:hover:bg-white/[0.08] transition-all duration-150 cursor-pointer"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <ChevronRight className="size-4.5" /> : <ChevronLeft className="size-4.5" />}
              </button>
            </div>

            {items.map((n) => {
              const active = n.to.includes("?")
                ? pathname === n.to.split("?")[0] && search === "?" + n.to.split("?")[1]
                : pathname === n.to && !search.includes("tab=billing");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`group flex items-center transition-all duration-200 ${
                    isCollapsed ? "justify-center p-3 mx-1 rounded-xl" : "gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl"
                  } ${
                    active
                      ? "bg-primary/12 text-primary border border-primary/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }`}
                  title={isCollapsed ? n.label : undefined}
                >
                  <n.icon className={`shrink-0 transition-colors ${isCollapsed ? "size-5" : "size-4"} ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                  {!isCollapsed && (
                    <>
                      <span className="truncate">{n.label}</span>
                      {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                    </>
                  )}
                </Link>
              );
            })}

            {/* Subscription card in sidebar */}
            {!isCollapsed && !isAdmin && (
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
            )}
          </nav>
        </aside>

        {/* Mobile Drawer Sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer content */}
            <div className="fixed inset-y-0 left-0 flex w-[260px] flex-col bg-card border-r border-border dark:bg-[oklch(0.095_0.014_258)] dark:border-white/[0.08] p-5 shadow-panel animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[15px] font-extrabold tracking-[-0.025em] text-foreground dark:text-white">
                  Stream<span className="text-gradient">Vault</span> Console
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-foreground/10 text-foreground/60 hover:text-foreground dark:hover:bg-white/[0.08] dark:text-white/60 dark:hover:text-white cursor-pointer"
                >
                  <X className="size-4.5" />
                </button>
              </div>
              <nav className="space-y-1">
                {items.map((n) => {
                  const active = pathname === n.to;
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                        active
                          ? "bg-primary/12 text-primary border border-primary/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                      }`}
                    >
                      <n.icon className={`size-4.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      {n.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="min-w-0">
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-foreground/5 text-foreground/70 hover:text-foreground hover:bg-foreground/10 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-white/70 dark:hover:text-white dark:hover:bg-white/[0.08] cursor-pointer shrink-0"
              aria-label="Toggle navigation"
            >
              <Menu className="size-4.5" />
            </button>
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
