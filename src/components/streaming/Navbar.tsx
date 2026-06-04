import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
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
import { Film, Search, Sun, Moon, Monitor, Menu, X, Bell } from "lucide-react";

const NAV = [
  { to: "/browse", label: "Home" },
  { to: "/library", label: "Library" },
  { to: "/pricing", label: "Plans" },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const ThemeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-bold shrink-0">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow-sm">
            <Film className="size-4" />
          </span>
          <span className="text-lg tracking-tight">
            Stream<span className="text-gradient">Vault</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50"
            >
              {n.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50"
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Search" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/library">
              <Search className="size-4.5" />
            </Link>
          </Button>

          {isAuthenticated && (
            <Button variant="ghost" size="icon" aria-label="Notifications" className="text-muted-foreground hover:text-foreground">
              <Bell className="size-4.5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Theme" className="text-muted-foreground hover:text-foreground">
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
                  className="ml-1 inline-flex size-9 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-border transition hover:ring-primary/60 shadow-card"
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
              <Button variant="ghost" size="sm" asChild>
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
            className="md:hidden text-muted-foreground"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 glass md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {n.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link to="/dashboard" onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                Dashboard
              </Link>
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
