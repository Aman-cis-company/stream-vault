import { Link } from "react-router-dom";
import {
  Twitter,
  Youtube,
  Instagram,
  Facebook,
  Github,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import streamVaultLogo from "@/assets/streamvault-logo.png";

function LogoMark() {
  return (
    <img
      src={streamVaultLogo}
      alt="StreamVault"
      className="object-contain h-[28px] w-auto md:h-[44px] lg:h-[50px] transition-all"
      style={{ mixBlendMode: "screen" }}
    />
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

const BADGES = [
  "4K Ultra HD",
  "Dolby Atmos",
  "HDR10",
  "Offline Mode",
  "DRM Protected",
];

export function Footer() {
  const handleNewsletter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("You're subscribed!", {
      description: "We'll send you new release updates and curated picks.",
    });
    (e.currentTarget.querySelector("input") as HTMLInputElement).value = "";
  };

  return (
    <footer className="mt-24 border-t border-zinc-800 bg-[#07080d]/50 backdrop-blur-md text-zinc-100 ambient-glow-blue">
      {/* Newsletter strip */}
      <div className="border-b border-zinc-800 bg-zinc-900/20">
        <div className="flex flex-col gap-6 px-4 py-10 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-12">
          <div>
            <p className="text-base font-bold text-zinc-100">Stay in the loop</p>
            <p className="mt-1 text-sm text-zinc-400">
              New releases, curated picks, and platform news.
            </p>
          </div>
          <form
            onSubmit={handleNewsletter}
            className="flex w-full max-w-sm gap-2 mx-auto sm:mx-0"
          >
            <Input
              type="email"
              placeholder="your@email.com"
              required
              className="flex-1 h-10 rounded-xl border-zinc-800 bg-zinc-900/60 text-white placeholder:text-zinc-500 focus:border-primary/50"
              aria-label="Email"
            />
            <Button
              type="submit"
              className="h-10 px-5 rounded-xl font-semibold shadow-glow-sm shrink-0"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-[#0b0c13]/30">
        <div className="grid gap-10 px-4 py-14 grid-cols-2 lg:grid-cols-5 md:px-8 lg:px-12">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <Link to="/" className="flex items-center group w-fit mx-auto lg:mx-0">
              <div className="transition-transform duration-200 group-hover:scale-105">
                <LogoMark />
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
              Premium entertainment for India and beyond. Stream thousands of
              films and series in stunning 4K HDR. Over 2.4 million subscribers
              worldwide.
            </p>

            {/* Social links */}
            <div className="mt-5 flex gap-2 justify-center lg:justify-start">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-zinc-800 text-zinc-400 transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                >
                  <s.icon className="size-3.5" />
                </a>
              ))}
            </div>

            {/* Badges */}
            <div className="mt-5 flex flex-wrap gap-1.5 justify-center lg:justify-start">
              {BADGES.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-lg bg-zinc-900/60 border border-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {COLS.map((c) => (
            <div key={c.title} className="col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 mb-4">
                {c.title}
              </h3>
              <ul className="space-y-3">
                {c.links.map(([label, to]) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="group text-sm text-zinc-400 transition-colors hover:text-zinc-100 flex items-center gap-1"
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
        <div className="border-t border-zinc-800">
          <div className="flex flex-col gap-4 px-4 py-6 sm:px-0 sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-12">
            <p className="text-xs text-zinc-500 text-center sm:text-left">
              © {new Date().getFullYear()} StreamVault, Inc. All rights
              reserved. Prices shown in Indian Rupees (₹).
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500 justify-center sm:justify-start">
              <Link
                to="/privacy"
                className="hover:text-zinc-100 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-zinc-100 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/record-keeping"
                className="hover:text-zinc-100 transition-colors"
              >
                18 U.S.C. § 2257
              </Link>
              <Link
                to="/help"
                className="hover:text-zinc-100 transition-colors"
              >
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
