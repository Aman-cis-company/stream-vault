import { Link } from "react-router-dom";
import heroBackdrop from "@/assets/hero-backdrop.jpg";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { plans, testimonials, genres } from "@/lib/mock-data";
import type { Title } from "@/lib/mock-data";
import { TitleRow } from "@/components/streaming/TitleRow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Play,
  Check,
  Tv,
  Download,
  Sparkles,
  ShieldCheck,
  Star,
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import apiClient from "@/services/api";
import { mapMovieToTitle } from "@/lib/movies";
import { BackendMovie } from "@/store/slices/moviesSlice";


const FEATURES = [
  { icon: Tv, title: "4K Ultra HD + HDR", desc: "Cinema-grade picture and Dolby Atmos spatial audio on every device." },
  { icon: Download, title: "Watch Offline", desc: "Download your favorites and stream anywhere, no internet required." },
  { icon: Sparkles, title: "Smart Recommendations", desc: "An AI-powered feed tuned to your taste that keeps getting better." },
  { icon: ShieldCheck, title: "Cancel Anytime", desc: "No contracts, no hidden fees. You're always in full control." },
];

const DEVICES = [
  { icon: Tv, label: "Smart TV", desc: "Samsung, LG, Sony, Apple TV, Fire TV" },
  { icon: Smartphone, label: "Mobile", desc: "iOS & Android — phones and tablets" },
  { icon: Laptop, label: "Web", desc: "Any browser, any OS, any screen size" },
  { icon: Monitor, label: "Desktop App", desc: "Windows & Mac native app with 4K" },
  { icon: Tablet, label: "Tablet", desc: "iPad, Galaxy Tab, Kindle Fire" },
  { icon: Zap, label: "Game Consoles", desc: "PlayStation 5, Xbox Series X/S" },
];

const FAQ = [
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes, absolutely. You can cancel your subscription at any time from your account dashboard, with no cancellation fees. You'll continue to have access until the end of your billing period.",
  },
  {
    q: "How many devices can I stream on simultaneously?",
    a: "It depends on your plan. Standard allows 2 simultaneous streams, Premium allows 4, and Cinephile allows 6. You can also download content for offline viewing on up to the same number of devices.",
  },
  {
    q: "What video quality is available?",
    a: "Standard plan offers Full HD (1080p). Premium and Cinephile plans offer 4K Ultra HD with HDR10, Dolby Vision, and Dolby Atmos spatial audio where available — delivering a true cinema experience.",
  },
  {
    q: "Can I download titles for offline viewing?",
    a: "Yes, Premium and Cinephile plan subscribers can download titles to watch offline on up to 4 or 6 devices respectively. Downloads are available for 30 days and remain playable for 48 hours once you start watching.",
  },
  {
    q: "How does the affiliate program work?",
    a: "Earn 20% recurring commission on every subscriber you refer, for as long as they remain a paying customer. Payouts are processed monthly with a minimum threshold of $25, with no cap on earnings.",
  },
  {
    q: "Is there a free trial?",
    a: "We offer a 7-day free trial for new subscribers on all plans. No credit card is required to start your trial, and you can cancel before the trial ends without being charged.",
  },
];

export default function Landing() {
  const [moviesByCategory, setMoviesByCategory] = useState<Record<number, Title[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      async function load() {
        try {
          const [movRes] = await Promise.all([
            apiClient.get("/movies?status=published&limit=100"),
          ]);

          const movies: BackendMovie[] = movRes.data.data.movies ?? [];
          const byCat: Record<number, Title[]> = {};
          const rest: Title[] = [];
  
          movies.forEach((m) => {
            const mapped = mapMovieToTitle(m);
            if (m.category_id) {
              if (!byCat[m.category_id]) byCat[m.category_id] = [];
              byCat[m.category_id].push(mapped);
            } else {
              rest.push(mapped);
            }
          });
          setMoviesByCategory(byCat);
        } catch {
          // show empty state on API failure
        } finally {
          setLoading(false);
        }
      }
      load();
    }, []);

  return (
    <MainLayout flush>
      {/* ── Hero ── */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
        <img
          src={heroBackdrop}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/65 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
              ✦ Now Streaming — 50,000+ Titles
            </Badge>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Stories worth{" "}
              <span className="text-gradient">staying in</span> for.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-foreground/80 leading-relaxed">
              Unlimited movies, award-winning originals, and live events — streaming in 4K HDR,
              starting at just <strong className="text-foreground">₹167/month</strong>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="shadow-glow text-base px-7">
                <Link to="/signup"><Play className="mr-2 size-5 fill-current" /> Start Watching</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild className="text-base px-7">
                <Link to="/pricing">View Plans</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              7-day free trial · No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6">

        {/* ── Features ── */}
        <section>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to stream smarter</h2>
            <p className="mt-2 text-muted-foreground">Built for people who take their entertainment seriously.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-glow/20">
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                  <f.icon className="size-6" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trending Now ── */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Trending This Week</h2>
              <p className="mt-1 text-sm text-muted-foreground">What everyone's watching right now</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/browse">View all <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
          {/* <TitleRow heading="" titles={titles.filter((t) => t.trending)} /> */}
            <TitleRow heading="" titles={moviesByCategory[3]} />
        </section>

        {/* ── New Releases ── */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">New Releases</h2>
              <p className="mt-1 text-sm text-muted-foreground">Fresh titles added this month</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/library">Browse all <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
          <TitleRow heading="" titles={Object.values(moviesByCategory).flat().filter((t) => t.newRelease)} />
        </section>

        {/* ── Browse by Genre ── */}
        <section>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Browse by Genre</h2>
            <p className="mt-2 text-muted-foreground">Explore thousands of titles across every category</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {genres.map((g) => (
              <Link
                key={g.name}
                to="/library"
                className="group relative overflow-hidden rounded-xl aspect-[16/9] bg-card border border-border"
              >
                <img
                  src={`/public/images/categories/${g.src}`}
                  // src={`https://picsum.photos/seed/${g.seed}/400/225`}
                  alt={g.name}
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 transition-opacity group-hover:from-black/90" />
                <div className="absolute inset-0 flex flex-col items-start justify-end p-4">
                  <span className="text-base font-bold text-white">{g.name}</span>
                  <span className="text-xs text-white/70">{g.count.toLocaleString()} titles</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="rounded-2xl border border-border bg-card/60 p-8 sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-3 bg-success/15 text-success border-success/30 hover:bg-success/15">7-day free trial</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Pick the plan that fits</h2>
            <p className="mt-2 text-muted-foreground">Switch or cancel anytime. No commitments, no surprises.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-xl border p-6 transition-all hover:shadow-lg ${
                  p.highlight
                    ? "border-primary shadow-glow bg-gradient-to-b from-primary/10 to-transparent"
                    : "border-border bg-card"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow">
                    Most Popular
                  </span>
                )}
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="mt-3 text-4xl font-bold">
                  ₹{p.perMonthInr}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">₹{p.priceInr} billed {p.cadence.toLowerCase()}</p>
                <div className="mt-4 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                  <span className="font-medium">{p.quality}</span>
                  <span className="text-muted-foreground"> · {p.screens} screens</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" /> {feat}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={p.highlight ? "default" : "secondary"} asChild>
                  <Link to="/signup">Start Free Trial</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            All plans include a 7-day free trial. Cancel before your trial ends and you won't be charged.
          </p>
        </section>

        {/* ── Testimonials ── */}
        <section>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Loved by millions of viewers</h2>
            <p className="mt-2 text-muted-foreground">Don't take our word for it — hear from our subscribers</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="flex flex-col rounded-xl border border-border bg-card p-6 transition-colors hover:border-border/80">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-warning text-warning" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                  "{t.text}"
                </blockquote>
                <div className="mt-5 flex items-center gap-3">
                  <img
                    src={`https://i.pravatar.cc/48?img=${t.avatarSeed}`}
                    alt={t.name}
                    className="size-10 rounded-full object-cover ring-2 ring-border"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Watch Anywhere ── */}
        <section className="rounded-2xl border border-border bg-card/60 p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
                Available everywhere
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">Watch on any screen, anywhere</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Stream seamlessly across all your devices. Start a film on your TV,
                continue on your phone during your commute, and finish on your laptop — right where you left off.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {DEVICES.map((d) => (
                  <div key={d.label} className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
                    <d.icon className="size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-semibold">{d.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{d.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl border border-border shadow-2xl">
                <img
                  src="https://picsum.photos/seed/svdevice1/600/400"
                  alt="Watch on any device"
                  className="w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="rounded-xl bg-black/50 backdrop-blur-md p-3 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded overflow-hidden shrink-0">
                        <img src={`https://picsum.photos/seed/svposter15/40/40`} alt="" className="size-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">Neon Requiem</p>
                        <div className="mt-1 h-1 rounded-full bg-white/20">
                          <div className="h-full w-2/5 rounded-full bg-primary" />
                        </div>
                      </div>
                      <div className="size-7 rounded-full bg-primary/80 flex items-center justify-center shrink-0">
                        <Play className="size-3 fill-white text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Frequently asked questions</h2>
            <p className="mt-2 text-muted-foreground">Everything you need to know before subscribing</p>
          </div>
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-xl border border-border bg-card px-6 data-[state=open]:border-primary/40"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to start watching?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Join over 2.4 million subscribers. Start your 7-day free trial today — no credit card required.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button size="lg" asChild className="shadow-glow px-8">
              <Link to="/signup"><Play className="mr-2 size-5 fill-current" /> Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/pricing">Compare Plans</Link>
            </Button>
          </div>
        </section>

      </div>
    </MainLayout>
  );
}
