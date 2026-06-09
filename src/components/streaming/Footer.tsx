import { Link } from "react-router-dom";
import { Film, Twitter, Youtube, Instagram, Facebook, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const COLS = [
  {
    title: "Explore",
    links: [["Home", "/browse"], ["Library", "/library"], ["Plans & Pricing", "/pricing"], ["Browse by Genre", "/library"]],
  },
  {
    title: "Account",
    links: [["Dashboard", "/dashboard"], ["Profile & Security", "/profile"], ["Affiliate Program", "/affiliate"], ["Billing", "/dashboard"]],
  },
  {
    title: "Company",
    links: [["About StreamVault", "/"], ["Sign in", "/login"], ["Get Started", "/signup"], ["Admin Console", "/admin"]],
  },
] as const;

const SOCIAL = [
  { icon: Twitter, label: "Twitter" },
  { icon: Youtube, label: "YouTube" },
  { icon: Instagram, label: "Instagram" },
  { icon: Facebook, label: "Facebook" },
  { icon: Github, label: "GitHub" },
];

export function Footer() {
  const handleNewsletter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("You're subscribed!", { description: "We'll send you new release updates and curated picks." });
    (e.currentTarget.querySelector("input") as HTMLInputElement).value = "";
  };

  return (
    <footer className="mt-20 border-t border-border/50">
      <div className="border-b border-border/40 bg-card/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-semibold">Stay in the loop</p>
            <p className="text-sm text-muted-foreground">New releases, curated picks, and platform news.</p>
          </div>
          <form onSubmit={handleNewsletter} className="flex w-full max-w-sm gap-2">
            <Input type="email" placeholder="your@email.com" required className="flex-1" aria-label="Email" />
            <Button type="submit" className="shrink-0">Subscribe</Button>
          </form>
        </div>
      </div>

      <div className="bg-card/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 font-bold">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow-sm">
                <Film className="size-5" />
              </span>
              <span className="text-xl tracking-tight">Stream<span className="text-gradient">Vault</span></span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Premium entertainment for India and beyond. Stream thousands of films and series in stunning 4K HDR. Over 2.4 million subscribers worldwide.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["4K Ultra HD", "Dolby Atmos", "HDR10", "Offline Mode"].map((b) => (
                <span key={b} className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {COLS.map((c) => (
            <div key={c.title}>
              <h3 className="text-sm font-semibold tracking-wide">{c.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {c.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/50 px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} StreamVault. All rights reserved. Prices shown in Indian Rupees (₹).
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
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
