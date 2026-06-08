import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { plans as mockPlans, type Plan } from "@/lib/mock-data";
import { fetchPlans, type BackendPlan } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import {
  Check, Zap, Shield, CreditCard, Lock, X,
  Sparkles, Tv2, Monitor, Smartphone, Wifi, Crown, Star,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

function mapBackendPlan(p: BackendPlan, index: number): Plan {
  const cadenceMap: Record<string, Plan["cadence"]> = { monthly: "Monthly", yearly: "Yearly" };
  const price = Number(p.price);
  const cadence = cadenceMap[p.billing_cycle] ?? "Monthly";
  const monthlyPrice = cadence === "Yearly" ? Math.round(price / 12) : price;
  return {
    id: String(p.id),
    backendPlanId: p.id,
    name: p.name,
    cadence,
    priceInr: price,
    perMonthInr: monthlyPrice,
    quality: "Full HD 1080p",
    screens: 2,
    features: Array.isArray(p.features_json)
      ? p.features_json
      : [`${cadence} billing`, "Unlimited streaming", "Cancel anytime"],
    highlight: index === 1,
  };
}

const TRUST_BADGES = [
  { icon: Shield, label: "256-bit SSL", sublabel: "Encrypted checkout" },
  { icon: CreditCard, label: "Stripe Secured", sublabel: "PCI DSS compliant" },
  { icon: Lock, label: "No hidden fees", sublabel: "Cancel anytime" },
  { icon: Wifi, label: "All devices", sublabel: "Watch anywhere" },
];

const PLATFORM_ICONS = [
  { icon: Tv2, label: "Smart TV" },
  { icon: Monitor, label: "Desktop" },
  { icon: Smartphone, label: "Mobile" },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [selected, setSelected] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans()
      .then((data) => { if (data.length > 0) setPlans(data.map(mapBackendPlan)); })
      .catch(() => {});
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { returnTo: "/pricing" } });
      return;
    }
    setSelected(plan);
  };

  const handleCheckout = () => {
    if (!selected) return;
    navigate(`/checkout?plan_id=${selected.backendPlanId}`);
  };

  return (
    <MainLayout>
      {/* ── Hero Section ── */}
      <div className="relative mx-auto max-w-3xl text-center pb-4">
        {/* Glow blob behind title */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -translate-y-1/2 h-48 w-full rounded-full bg-primary/10 blur-3xl" />

        <div className="relative inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
          <Sparkles className="size-3.5" />
          7-day free trial on all plans — no credit card required to explore
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Unlimited streaming,{" "}
          <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            one subscription
          </span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Access thousands of movies, series, and exclusives. Switch, pause, or cancel
          anytime — no questions asked.
        </p>

        {/* Platform icons */}
        <div className="mt-6 flex items-center justify-center gap-6">
          {PLATFORM_ICONS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-card shadow-card">
                <Icon className="size-4.5 text-muted-foreground" />
              </span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Plan Cards ── */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-300 ${
              p.highlight
                ? "border-primary/50 bg-gradient-to-b from-primary/[0.12] via-primary/[0.06] to-transparent shadow-[0_0_60px_-10px] shadow-primary/25 scale-[1.02]"
                : "border-border bg-card/60 hover:border-primary/30 hover:shadow-card-hover hover:-translate-y-1"
            }`}
          >
            {p.highlight && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-orange-400 px-4 py-1 text-xs font-bold text-white shadow-glow">
                  <Crown className="size-3" /> Most Popular
                </span>
              </div>
            )}

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{p.name}</h2>
                <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  p.cadence === "Yearly"
                    ? "bg-success/15 text-success"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {p.cadence}
                  {p.cadence === "Yearly" && " · Save 20%"}
                </span>
              </div>
              {p.highlight && <Star className="size-5 fill-primary text-primary mt-0.5" />}
            </div>

            <div className="mt-5">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold tracking-tight">₹{p.perMonthInr}</span>
                <span className="mb-1 text-sm text-muted-foreground">/mo</span>
              </div>
              {p.cadence === "Yearly" && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  ₹{p.priceInr} billed yearly
                </p>
              )}
            </div>

            {/* Quality badge */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/50 px-3 py-2">
              <Tv2 className="size-3.5 shrink-0 text-primary" />
              <span className="text-xs font-medium">{p.quality}</span>
              <span className="mx-1 text-border">·</span>
              <span className="text-xs text-muted-foreground">{p.screens} screen{p.screens > 1 ? "s" : ""}</span>
            </div>

            <ul className="mt-5 flex-1 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <span className={`mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full ${
                    p.highlight ? "bg-primary/20 text-primary" : "bg-success/15 text-success"
                  }`}>
                    <Check className="size-2.5 stroke-[3]" />
                  </span>
                  <span className="text-foreground/85">{f}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`mt-7 w-full h-11 font-semibold tracking-wide transition-all ${
                p.highlight
                  ? "bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 shadow-glow text-white border-0"
                  : ""
              }`}
              variant={p.highlight ? "default" : "secondary"}
              onClick={() => handleSelectPlan(p)}
            >
              {isAuthenticated ? (
                <><Zap className="mr-2 size-4" />Get {p.name}</>
              ) : (
                <><Lock className="mr-2 size-4" />Sign in to Subscribe</>
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* ── Trust Badges ── */}
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TRUST_BADGES.map(({ icon: Icon, label, sublabel }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="size-4 text-primary" />
            </span>
            <div>
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[10px] text-muted-foreground">{sublabel}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Payments processed securely by{" "}
        <span className="font-semibold text-foreground">Stripe</span>.
        All prices are in INR and inclusive of applicable taxes.
      </p>

      {/* ── Confirmation Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Gradient accent top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary to-orange-400" />

            <div className="p-6 sm:p-7">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-5 right-5 flex size-7 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15">
                  <CreditCard className="size-5 text-primary" />
                </span>
                <div>
                  <h3 className="text-base font-bold">Confirm Subscription</h3>
                  <p className="text-xs text-muted-foreground">Review your order below</p>
                </div>
              </div>

              {/* Order summary */}
              <div className="rounded-xl border border-border/60 bg-secondary/40 divide-y divide-border/40 overflow-hidden mb-5">
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-semibold">{selected.name}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Billing cycle</span>
                  <span className="inline-flex items-center gap-1">
                    {selected.cadence}
                    {selected.cadence === "Yearly" && (
                      <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                        Save 20%
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Trial period</span>
                  <span className="text-success font-medium">7 days free</span>
                </div>
                <div className="flex items-center justify-between bg-secondary/60 px-4 py-3 font-bold">
                  <span>Total today</span>
                  <span className="text-lg text-primary">₹{selected.priceInr}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground text-center mb-5 leading-relaxed">
                You'll complete payment on our secure checkout page.
                Your card details go directly to Stripe — never stored on our servers.
              </p>

              <div className="flex flex-col gap-2.5">
                <Button
                  className="h-11 w-full bg-gradient-to-r from-primary to-orange-500 font-semibold shadow-glow hover:from-primary/90 hover:to-orange-500/90 border-0 text-white"
                  onClick={handleCheckout}
                >
                  <><Lock className="mr-2 size-4" />Continue to Payment</>

                </Button>
                <Button variant="ghost" className="h-9 text-sm" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Shield className="size-3" /> SSL Encrypted</span>
                <span className="size-1 rounded-full bg-border" />
                <span className="flex items-center gap-1"><Lock className="size-3" /> PCI Compliant</span>
                <span className="size-1 rounded-full bg-border" />
                <span className="flex items-center gap-1"><CreditCard className="size-3" /> Stripe</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
