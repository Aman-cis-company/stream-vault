import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  Bell,
  Bookmark,
  ChevronDown,
  LayoutDashboard,
  User,
  Users,
  Shield,
  LogOut,
  Sparkles,
} from "lucide-react";

const NAV_PUBLIC = [
  { to: "/browse", label: "Home" },
  { to: "/library", label: "Library" },
  { to: "/pricing", label: "Plans" },
];

const NAV_AUTH = [
  { to: "/my-list", label: "My List", icon: Bookmark },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function StreamVaultLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="oklch(0.62 0.29 14)" />
      <path d="M12 10L24 16L12 22V10Z" fill="white" />
      <rect x="7" y="10" width="3" height="2" rx="1" fill="white" opacity="0.55" />
      <rect x="7" y="14" width="3" height="2" rx="1" fill="white" opacity="0.55" />
      <rect x="7" y="18" width="3" height="2" rx="1" fill="white" opacity="0.55" />
    </svg>
  );
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const ThemeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

  /* Only browse and landing pages get the transparent-to-solid scroll effect */
  const solidHeader = scrolled || (pathname !== "/browse" && pathname !== "/");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  /* ⌘K / Ctrl+K shortcut */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const isActive = (to: string) =>
    pathname === to || (to !== "/" && pathname.startsWith(to + "/"));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/library?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          solidHeader
            ? "border-b border-white/[0.07] shadow-[0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.7)] backdrop-blur-2xl backdrop-saturate-[1.8] bg-[oklch(0.075_0.012_258)]/85"
            : "bg-gradient-to-b from-black/75 via-black/35 to-transparent border-b border-transparent"
        }`}
      >
        <div className="flex h-[66px] w-full items-center gap-6 px-4 md:px-8 lg:px-12">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="StreamVault home">
            <div className="relative transition-transform duration-200 group-hover:scale-[1.07]">
              <div className="absolute inset-0 rounded-[9px] bg-primary/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <StreamVaultLogo />
              </div>
            </div>
            <span className="text-[17px] font-extrabold tracking-[-0.025em] text-white">
              Stream<span className="text-gradient">Vault</span>
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {NAV_PUBLIC.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`relative rounded-xl px-3.5 py-2 text-[13.5px] font-semibold transition-all duration-200 ${
                  isActive(n.to)
                    ? "text-white bg-white/10"
                    : "text-white/50 hover:text-white hover:bg-white/[0.07]"
                }`}
              >
                {n.label}
                {isActive(n.to) && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            ))}

            {/* Separator */}
            {isAuthenticated && (
              <span className="mx-1.5 h-4 w-px bg-white/[0.12] rounded-full" />
            )}

            {isAuthenticated && NAV_AUTH.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`relative rounded-xl px-3.5 py-2 text-[13.5px] font-semibold transition-all duration-200 inline-flex items-center gap-1.5 ${
                  isActive(n.to)
                    ? "text-white bg-white/10"
                    : "text-white/50 hover:text-white hover:bg-white/[0.07]"
                }`}
              >
                <n.icon className="size-3.5" />
                {n.label}
                {isActive(n.to) && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          {/* ── Right cluster ── */}
          <div className="ml-auto flex items-center gap-1">

            {/* Search — inline bar on ≥lg, icon on smaller */}
            {searchOpen ? (
              <form
                onSubmit={handleSearch}
                className="relative flex items-center"
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/40" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search titles…"
                    className="h-9 w-[220px] rounded-xl border border-white/12 bg-white/8 pl-8.5 pr-14 text-[13px] text-white placeholder:text-white/35 outline-none focus:border-white/25 focus:bg-white/10 transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-white/15 bg-white/8 px-1.5 font-mono text-[10px] text-white/35">
                      ESC
                    </kbd>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="text-white/35 hover:text-white transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="hidden sm:flex items-center gap-2 h-9 rounded-xl border border-white/[0.09] bg-white/[0.05] px-3 text-[12.5px] text-white/40 hover:text-white/70 hover:bg-white/[0.08] hover:border-white/[0.13] transition-all duration-200"
              >
                <Search className="size-3.5 shrink-0" />
                <span className="hidden lg:inline">Search</span>
                <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-white/12 bg-white/8 px-1.5 font-mono text-[10px] ml-1">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Bell (authenticated) */}
            {isAuthenticated && (
              <button
                aria-label="Notifications"
                className="relative size-9 flex items-center justify-center rounded-xl text-white/45 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
              >
                <Bell className="size-5" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(0,0,0,0.5)]" />
              </button>
            )}

            {/* Theme picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Theme"
                  className="size-9 flex items-center justify-center rounded-xl text-white/45 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
                >
                  <ThemeIcon className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-xl">
                <DropdownMenuItem onClick={() => setMode("light")} className="rounded-lg text-[13px]">
                  <Sun className="mr-2 size-3.5 text-warning" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode("dark")} className="rounded-lg text-[13px]">
                  <Moon className="mr-2 size-3.5 text-primary" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode("system")} className="rounded-lg text-[13px]">
                  <Monitor className="mr-2 size-3.5" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ── Authenticated: avatar dropdown ── */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="ml-0.5 flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-2 py-1.5 transition-all duration-200 hover:bg-white/[0.09] hover:border-white/[0.16] focus:outline-none"
                    aria-label="Account menu"
                  >
                    <span
                      className="inline-flex size-[26px] items-center justify-center rounded-lg text-[11px] font-extrabold text-white shrink-0 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.5)]"
                      style={{
                        background: `linear-gradient(135deg, oklch(0.62 0.29 ${user!.avatarHue}), oklch(0.42 0.22 ${(user!.avatarHue + 55) % 360}))`,
                      }}
                    >
                      {user!.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden lg:block text-[13px] font-semibold text-white/80 max-w-[96px] truncate">
                      {user!.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="size-3 text-white/30 shrink-0" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64 rounded-2xl p-1.5 border-white/[0.09]">
                  {/* User info header */}
                  <DropdownMenuLabel className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex size-10 items-center justify-center rounded-xl text-sm font-extrabold text-white shrink-0 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)]"
                        style={{
                          background: `linear-gradient(135deg, oklch(0.62 0.29 ${user!.avatarHue}), oklch(0.42 0.22 ${(user!.avatarHue + 55) % 360}))`,
                        }}
                      >
                        {user!.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{user!.name}</p>
                        <p className="text-[11px] font-normal text-white/40 truncate">{user!.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="mx-2 bg-white/[0.07]" />

                  <DropdownMenuItem asChild className="rounded-xl mx-0.5 text-[13px] gap-2.5">
                    <Link to="/dashboard">
                      <LayoutDashboard className="size-3.5 text-muted-foreground" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl mx-0.5 text-[13px] gap-2.5">
                    <Link to="/my-list">
                      <Bookmark className="size-3.5 text-muted-foreground" /> My List
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl mx-0.5 text-[13px] gap-2.5">
                    <Link to="/profile">
                      <User className="size-3.5 text-muted-foreground" /> Profile & Security
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl mx-0.5 text-[13px] gap-2.5">
                    <Link to="/affiliate">
                      <Users className="size-3.5 text-muted-foreground" /> Affiliate Program
                    </Link>
                  </DropdownMenuItem>

                  {user!.role === "admin" && (
                    <>
                      <DropdownMenuSeparator className="mx-2 bg-white/[0.07]" />
                      <DropdownMenuItem asChild className="rounded-xl mx-0.5 text-[13px] gap-2.5">
                        <Link to="/admin" className="text-primary">
                          <Shield className="size-3.5" /> Admin Console
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator className="mx-2 bg-white/[0.07]" />
                  <DropdownMenuItem
                    className="rounded-xl mx-0.5 text-[13px] gap-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => { logout().finally(() => navigate("/")); }}
                  >
                    <LogOut className="size-3.5" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* ── Not authenticated ── */
              <div className="ml-1 hidden items-center gap-2 sm:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white/55 hover:text-white hover:bg-white/[0.08]"
                >
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="h-9 px-4 rounded-xl text-[13px] font-bold bg-primary hover:bg-primary/90 text-white shadow-glow-sm gap-1.5"
                >
                  <Link to="/signup">
                    <Sparkles className="size-3.5" />
                    Get Started
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden size-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
              aria-label="Menu"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileOpen ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-white/[0.07] backdrop-blur-2xl backdrop-saturate-[1.8] bg-[oklch(0.075_0.012_258)]/95">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="px-4 pt-4 pb-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/35" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search titles…"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.07] pl-9 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </div>
            </form>

            <nav className="px-3 pb-4 space-y-0.5">
              {NAV_PUBLIC.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center rounded-xl px-4 py-3 text-[13.5px] font-semibold transition-colors ${
                    isActive(n.to)
                      ? "bg-primary/12 text-primary"
                      : "text-white/55 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              ))}

              {isAuthenticated && (
                <>
                  <div className="h-px bg-white/[0.07] mx-1 my-1" />
                  {NAV_AUTH.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13.5px] font-semibold transition-colors ${
                        isActive(n.to)
                          ? "bg-primary/12 text-primary"
                          : "text-white/55 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      <n.icon className="size-4" />
                      {n.label}
                    </Link>
                  ))}
                </>
              )}

              {!isAuthenticated && (
                <div className="flex gap-2 pt-2 mt-1 border-t border-white/[0.07]">
                  <Button variant="outline" className="flex-1 h-10 rounded-xl border-white/12 text-white hover:bg-white/[0.08]" asChild>
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 shadow-glow-sm font-bold gap-1.5" asChild>
                    <Link to="/signup">
                      <Sparkles className="size-3.5" /> Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
