import { Link } from "react-router-dom";
import { Twitter, Youtube, Instagram, Facebook, Github, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function LogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="oklch(0.62 0.29 14)" />
      <path d="M12 10L24 16L12 22V10Z" fill="white" />
      <rect x="7" y="10" width="3" height="2" rx="1" fill="white" opacity="0.5" />
      <rect x="7" y="14" width="3" height="2" rx="1" fill="white" opacity="0.5" />
      <rect x="7" y="18" width="3" height="2" rx="1" fill="white" opacity="0.5" />
    </svg>
  );
}

const COLS = [
  {
    title: "Explore",
    links: [
      ["Home", "/browse"],
      ["Library", "/library"],
      ["Plans & Pricing", "/pricing"],
      ["Browse by Genre", "/library"],
    ],
  },
  {
    title: "Account",
    links: [
      ["Dashboard", "/dashboard"],
      ["Profile & Security", "/profile"],
      ["Affiliate Program", "/affiliate"],
      ["Billing", "/dashboard"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About StreamVault", "/"],
      ["Sign in", "/login"],
      ["Get Started", "/signup"],
      ["Admin Console", "/admin"],
    ],
  },
] as const;

const SOCIAL = [
  { icon: Twitter, label: "Twitter" },
  { icon: Youtube, label: "YouTube" },
  { icon: Instagram, label: "Instagram" },
  { icon: Facebook, label: "Facebook" },
  { icon: Github, label: "GitHub" },
];

const BADGES = ["4K Ultra HD", "Dolby Atmos", "HDR10", "Offline Mode", "DRM Protected"];

export function Footer() {
  const handleNewsletter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("You're subscribed!", {
      description: "We'll send you new release updates and curated picks.",
    });
    (e.currentTarget.querySelector("input") as HTMLInputElement).value = "";
  };

  return (
    <footer className="mt-24 border-t border-white/6">
      {/* Newsletter strip */}
      <div className="border-b border-white/6 bg-card/20">
        <div className="flex flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-12">
          <div>
            <p className="text-base font-bold">Stay in the loop</p>
            <p className="mt-1 text-sm text-muted-foreground">New releases, curated picks, and platform news.</p>
          </div>
          <form onSubmit={handleNewsletter} className="flex w-full max-w-sm gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              required
              className="flex-1 h-10 rounded-xl border-border/60 bg-secondary/40 focus:border-primary/50"
              aria-label="Email"
            />
            <Button type="submit" className="h-10 px-5 rounded-xl font-semibold shadow-glow-sm shrink-0">
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-card/10">
        <div className="grid gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-5 md:px-8 lg:px-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="transition-transform duration-200 group-hover:scale-105">
                <LogoMark />
              </div>
              <span className="text-[18px] font-extrabold tracking-[-0.02em]">
                Stream<span className="text-gradient">Vault</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Premium entertainment for India and beyond. Stream thousands of films and series in stunning 4K HDR. Over 2.4 million subscribers worldwide.
            </p>

            {/* Social links */}
            <div className="mt-5 flex gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-border/50 text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                >
                  <s.icon className="size-3.5" />
                </a>
              ))}
            </div>

            {/* Badges */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {BADGES.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-lg bg-secondary/60 border border-border/40 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {COLS.map((c) => (
            <div key={c.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/70 mb-4">
                {c.title}
              </h3>
              <ul className="space-y-3">
                {c.links.map(([label, to]) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="group text-sm text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1"
                    >
                      {label}
                      <ArrowUpRight className="size-3 opacity-0 -translate-y-0.5 translate-x-0.5 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-12">
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} StreamVault, Inc. All rights reserved. Prices shown in Indian Rupees (₹).
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground/60">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <Link to="/record-keeping" className="hover:text-foreground transition-colors">18 U.S.C. § 2257</Link>
              <a href="#" className="hover:text-foreground transition-colors">Help Center</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
