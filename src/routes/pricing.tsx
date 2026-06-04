import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { plans as mockPlans, type Plan } from "@/lib/mock-data";
import { fetchPlans, type BackendPlan } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Lock, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";

function mapBackendPlan(p: BackendPlan, index: number): Plan {
  const cadenceMap: Record<string, Plan["cadence"]> = {
    monthly: "Monthly",
    yearly: "Yearly",
  };
  const price = Number(p.price);
  const cadence = cadenceMap[p.billing_cycle] ?? "Monthly";
  const monthlyPrice =
    cadence === "Yearly" ? Math.round(price / 12) : price;

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

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans()
      .then((data) => {
        if (data.length > 0) setPlans(data.map(mapBackendPlan));
      })
      .catch(() => {});
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { returnTo: "/pricing" } });
      return;
    }
    setSelected(plan);
  };

  const handleCheckout = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { data } = await api.post("/stripe/create-checkout-session", {
        plan_id: selected.backendPlanId,
        success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/payment/cancel`,
      });
      window.location.href = data.data.url;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not start checkout. Please try again.";
      toast.error("Checkout failed", { description: msg });
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl text-center">
        <Badge className="mb-4 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
          7-day free trial on all plans
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">Choose your plan</h1>
        <p className="mt-2 text-muted-foreground">
          One subscription, unlimited entertainment. Switch or cancel anytime.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`relative flex flex-col rounded-2xl border p-8 transition-all ${
              p.highlight
                ? "border-primary shadow-glow bg-gradient-to-b from-primary/10 to-transparent"
                : "border-border hover:border-primary/40 hover:shadow-lg"
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow">
                Most Popular
              </span>
            )}

            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p className="mt-3">
              <span className="text-4xl font-bold">₹{p.perMonthInr}</span>
              <span className="text-muted-foreground">/mo</span>
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              ₹{p.priceInr} billed {p.cadence.toLowerCase()}
            </p>

            <div className="mt-4 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span className="font-medium">{p.quality}</span>
              <span className="text-muted-foreground"> · {p.screens} screens</span>
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>

            <Button
              className="mt-8 w-full"
              variant={p.highlight ? "default" : "secondary"}
              onClick={() => handleSelectPlan(p)}
            >
              {isAuthenticated ? (
                <>
                  <Zap className="mr-1.5 size-4" /> Get {p.name}
                </>
              ) : (
                <>
                  <Lock className="mr-1.5 size-4" /> Sign in to Subscribe
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Secured by <span className="font-medium text-foreground">Stripe</span>. Cancel
        anytime. No hidden fees.
      </p>

      <Dialog open={!!selected} onOpenChange={(o) => !o && !loading && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm subscription</DialogTitle>
            <DialogDescription>
              You're subscribing to the <strong>{selected?.name}</strong> plan at{" "}
              <strong>₹{selected?.priceInr}</strong> billed{" "}
              {selected?.cadence.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border bg-secondary/50 p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{selected?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billing cycle</span>
              <span>{selected?.cadence}</span>
            </div>
            <div className="border-t border-border/60 pt-2 flex justify-between font-semibold">
              <span>Total today</span>
              <span>₹{selected?.priceInr}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You'll be redirected to Stripe's secure checkout page.
          </p>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSelected(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Redirecting…
                </>
              ) : (
                "Proceed to Payment →"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
