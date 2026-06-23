import { useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Search,
  BookOpen,
  CreditCard,
  Laptop,
  User,
  ChevronDown,
  Mail,
  MessageSquare,
  Clock,
  ArrowRight,
  ArrowLeft,
  LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: "billing",
    q: "How does the 7-day free trial work?",
    a: "When you sign up and select a subscription plan, your 7-day trial activates instantly. Your card is not charged during this trial period. You can cancel at any time from your Dashboard before the 7 days end to avoid billing.",
  },
  {
    category: "billing",
    q: "What payment methods are supported in India?",
    a: "We support all major payment types via Stripe, including domestic and international credit/debit cards (Visa, Mastercard, RuPay), UPI, and net banking from all major Indian banks.",
  },
  {
    category: "devices",
    q: "How many devices can watch concurrently?",
    a: "Concurrency depends on your active plan: Standard supports up to 2 screens concurrently, while Premium supports up to 4 screens. If you exceed this limit, the system will show a multi-screen block warning.",
  },
  {
    category: "devices",
    q: "Does StreamVault support 4K Ultra HD streaming?",
    a: "Yes! High-resolution streaming is supported up to 4K UHD with HDR10 and Dolby Atmos audio. Quality adjusts dynamically depending on your internet bandwidth. We recommend a minimum speed of 25 Mbps for stable 4K UHD streaming.",
  },
  {
    category: "account",
    q: "How do I configure Parental Controls and PIN locks?",
    a: "Go to settings, choose Parental Controls, choose configure PIN, set a secure 4-digit code, and toggle the age rating limits. Once set, content exceeding this limit will prompt for the PIN before playing.",
  },
  {
    category: "account",
    q: "How do I verify my age for restricted content?",
    a: "When clicking a movie rated 18+ or 21+, an Age Verification Modal will appear. Enter your date of birth, and our system will verify your eligibility instantly. The check is recorded securely in your profile audit log.",
  },
  {
    category: "trouble",
    q: "The video player keeps buffering. How do I fix this?",
    a: "Try resetting your router, ensuring your plan supports the stream resolution, or lowering the player quality. Clearing your browser cache or switching connection type (e.g. from Wi-Fi to Ethernet) can also help.",
  },
  {
    category: "trouble",
    q: "How does the dynamic Hindi dubbing option work?",
    a: "For supported videos, clicking the player settings lets you toggle dubbed Hindi audio. This audio track is generated dynamically via translation AI and synchronized with the original video playback timeline.",
  },
];

const HELP_CATEGORIES = [
  {
    id: "billing",
    label: "Billing & Plans",
    desc: "Payments, trials, invoices, and Stripe details",
    icon: CreditCard,
  },
  {
    id: "account",
    label: "Account & Profile",
    desc: "Parental PINs, profile settings, and age checks",
    icon: User,
  },
  {
    id: "devices",
    label: "Supported Devices",
    desc: "Smart TVs, Chromecast, 4K streaming requirements",
    icon: Laptop,
  },
  {
    id: "trouble",
    label: "Troubleshooting",
    desc: "Buffering issues, player errors, and audio controls",
    icon: BookOpen,
  },
];

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesSearch =
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory
      ? faq.category === activeCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  return (
    <MainLayout>
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="size-3.5" />
          Back to Browse
        </Link>

        {/* Glow Accent */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 h-[300px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />

        {/* Hero Search Section */}
        <div className="relative mb-12 text-center py-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary mb-4 shadow-[0_0_15px_rgba(192,57,43,0.15)]">
            <LifeBuoy className="size-3" /> Support Desk
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Help Center
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Search our knowledge base or explore specific categories to resolve
            your streaming questions.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-md mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              type="text"
              placeholder="Search for articles, plans, error codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 h-12 rounded-2xl border-border bg-card/45 backdrop-blur-md focus:border-primary/50 shadow-xl"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-14">
          {HELP_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                className={`text-left flex flex-col p-5 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-glow-sm"
                    : "border-border bg-card/45 hover:border-primary/30 hover:bg-secondary/25 hover:-translate-y-0.5"
                }`}
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-xl mb-4 ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <h3 className="font-bold text-foreground text-sm">{cat.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {cat.desc}
                </p>
                <span className="mt-auto pt-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight className="size-3" />
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* FAQs List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" />
              {activeCategory
                ? `Articles on ${HELP_CATEGORIES.find((c) => c.id === activeCategory)?.label}`
                : "Popular Questions"}
            </h2>

            {filteredFaqs.length > 0 ? (
              <div className="space-y-3">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border bg-card/30 overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-foreground/90 hover:text-foreground transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-primary" : ""
                          }`}
                        />
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          isOpen
                            ? "max-h-[200px] border-t border-border/40 p-5 bg-card/10"
                            : "max-h-0 overflow-hidden"
                        }`}
                      >
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center rounded-2xl border border-dashed border-border/60">
                <p className="text-sm text-muted-foreground">
                  No articles match your query.
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-primary"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar Support Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-border bg-card/45 p-6 backdrop-blur-md">
              <h2 className="text-base font-bold text-foreground mb-4">
                Still need help?
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Can't find the solution you're looking for? Reach out directly
                to our global team.
              </p>

              {/* Support Cards */}
              <div className="space-y-3">
                <a
                  href="mailto:support@streamvault.com"
                  className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 hover:border-primary/40 hover:bg-secondary/50 transition-all group"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Email Support
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      support@streamvault.com
                    </p>
                  </div>
                </a>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                    <MessageSquare className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Live Chat</h3>
                    <p className="text-[10px] text-muted-foreground">
                      Unavailable during weekends
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
                    <Clock className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      Response Window
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      Usually responds under 4 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
