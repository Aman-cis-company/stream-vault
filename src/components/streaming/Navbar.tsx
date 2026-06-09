import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { Film, Search, Sun, Moon, Monitor, Menu, X, Bell, Bookmark } from "lucide-react";

const NAV = [
  { to: "/browse", label: "Home" },
  { to: "/library", label: "Library" },
  { to: "/pricing", label: "Plans" },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const ThemeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border/40 glass shadow-lg"
          : "border-b border-transparent bg-gradient-to-b from-black/70 via-black/30 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold shrink-0 group">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow-sm transition-transform group-hover:scale-110">
            <Film className="size-4" />
          </span>
          <span className="text-lg tracking-tight">
            Stream<span className="text-gradient">Vault</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(n.to)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {n.label}
              {isActive(n.to) && (
                <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-primary" />
              )}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <Link
                to="/my-list"
                className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                  isActive("/my-list")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Bookmark className="size-3.5" />
                My List
                {isActive("/my-list") && (
                  <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-primary" />
                )}
              </Link>
              <Link
                to="/dashboard"
                className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                Dashboard
                {isActive("/dashboard") && (
                  <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-primary" />
                )}
              </Link>
            </>
          )}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            asChild
            className="text-muted-foreground hover:text-foreground hover:bg-white/10"
          >
            <Link to="/library">
              <Search className="size-4.5" />
            </Link>
          </Button>

          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="text-muted-foreground hover:text-foreground hover:bg-white/10"
            >
              <Bell className="size-4.5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Theme"
                className="text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                <ThemeIcon className="size-4.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMode("light")}>
                <Sun className="mr-2 size-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode("dark")}>
                <Moon className="mr-2 size-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode("system")}>
                <Monitor className="mr-2 size-4" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 inline-flex size-9 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-border/60 transition-all hover:ring-primary/70 hover:scale-105 shadow-card"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.62 0.27 ${user!.avatarHue}), oklch(0.42 0.20 ${(user!.avatarHue + 55) % 360}))`,
                  }}
                  aria-label="Account menu"
                >
                  {user!.name.charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-58">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="font-semibold">{user!.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user!.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-list" className="flex items-center gap-2">
                    <Bookmark className="size-3.5" /> My List
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile & Security</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/affiliate">Affiliate Program</Link>
                </DropdownMenuItem>
                {user!.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin Console</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => { logout().finally(() => navigate("/")); }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild className="hover:bg-white/10">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="shadow-glow-sm">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:bg-white/10"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/40 glass md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(n.to)
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link
                  to="/my-list"
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                    isActive("/my-list")
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Bookmark className="size-3.5" /> My List
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}
            {!isAuthenticated && (
              <div className="mt-2 flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link to="/signup" onClick={() => setOpen(false)}>Get Started</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
