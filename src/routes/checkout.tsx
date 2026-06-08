import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Protected } from "@/components/streaming/Protected";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  Loader2, Lock, Shield, CreditCard, Check,
  ArrowLeft, Zap, AlertCircle, ChevronRight, User,
  MapPin, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface IntentData {
  clientSecret: string;
  subscriptionId: string;
  planId: number;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: string;
}

interface BillingDetails {
  name: string;
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// ── Stripe Elements appearance ────────────────────────────────────────────────

const STRIPE_APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#e5383b",
    colorBackground: "#1a1d2e",
    colorSurface: "#1e2235",
    colorText: "#f5f5f7",
    colorTextSecondary: "#8b8fa8",
    colorDanger: "#e5383b",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontSizeBase: "14px",
    spacingUnit: "5px",
    borderRadius: "10px",
    colorBorder: "#2e3250",
    colorInputBackground: "#161929",
    colorInputText: "#f5f5f7",
    colorInputPlaceholder: "#5a5f7d",
  },
  rules: {
    ".Input": { border: "1px solid #2e3250", backgroundColor: "#161929", color: "#f5f5f7", boxShadow: "none", transition: "border-color 0.15s" },
    ".Input:focus": { border: "1px solid #e5383b", boxShadow: "0 0 0 2px rgba(229,56,59,0.15)", outline: "none" },
    ".Input--invalid": { border: "1px solid #e5383b" },
    ".Label": { color: "#8b8fa8", fontWeight: "500", fontSize: "12px", letterSpacing: "0.05em" },
    ".Tab": { border: "1px solid #2e3250", backgroundColor: "#161929" },
    ".Tab:hover": { border: "1px solid #3d4268" },
    ".Tab--selected": { border: "1px solid #e5383b", backgroundColor: "#1e1022" },
    ".TabIcon--selected": { fill: "#e5383b" },
    ".TabLabel--selected": { color: "#e5383b" },
    ".Block": { backgroundColor: "#161929", border: "1px solid #2e3250" },
  },
};

// ── Shared field style helper ─────────────────────────────────────────────────

function fieldClass(invalid: boolean) {
  return `w-full rounded-xl border bg-[#161929] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all ${
    invalid
      ? "border-destructive focus:shadow-[0_0_0_2px_rgba(229,56,59,0.15)]"
      : "border-[#2e3250] focus:border-primary focus:shadow-[0_0_0_2px_rgba(229,56,59,0.15)]"
  }`;
}

// ── Plan Summary Sidebar ──────────────────────────────────────────────────────

function PlanSummary({ intent }: { intent: IntentData }) {
  const isYearly = intent.billingCycle === "yearly";
  const perMonth = isYearly ? Math.round(intent.amount / 12) : intent.amount;
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Your Plan</p>
        <h3 className="text-xl font-bold">{intent.planName}</h3>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{intent.billingCycle} billing</p>
      </div>
      <div className="rounded-xl border border-border/40 bg-secondary/40 divide-y divide-border/30 overflow-hidden text-sm">
        <div className="flex justify-between items-center px-4 py-2.5">
          <span className="text-muted-foreground">Per month</span>
          <span className="font-medium">₹{perMonth}</span>
        </div>
        {isYearly && (
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-muted-foreground">Billed yearly</span>
            <span className="font-medium">₹{intent.amount}</span>
          </div>
        )}
        <div className="flex justify-between items-center px-4 py-2.5">
          <span className="text-muted-foreground">Free trial</span>
          <span className="text-success font-semibold">7 days</span>
        </div>
        <div className="flex justify-between items-center bg-secondary/60 px-4 py-3 font-bold">
          <span>Due today</span>
          <span className="text-primary text-base">₹{intent.amount}</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {["Cancel anytime", "Stream on 2 screens", "Full HD 1080p", "No hidden fees"].map((f) => (
          <li key={f} className="flex items-center gap-2 text-muted-foreground">
            <Check className="size-3.5 text-success shrink-0" /> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Phase 1: Billing Details Form ─────────────────────────────────────────────

interface BillingFormProps {
  planId: string;
  onComplete: (intent: IntentData, stripePromise: ReturnType<typeof loadStripe>, billing: BillingDetails) => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir",
  "Ladakh","Lakshadweep","Puducherry",
];

function BillingForm({ planId, onComplete }: BillingFormProps) {
  const [billing, setBilling] = useState<BillingDetails>({
    name: "", line1: "", city: "", state: "", postal_code: "", country: "IN",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof BillingDetails, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof BillingDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setBilling((p) => ({ ...p, [field]: e.target.value }));
  const touch = (field: keyof BillingDetails) => () =>
    setTouched((p) => ({ ...p, [field]: true }));

  const invalid = (field: keyof BillingDetails) =>
    !!touched[field] && billing[field].trim().length < (field === "postal_code" ? 4 : 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      (Object.keys(billing) as (keyof BillingDetails)[]).map((k) => [k, true])
    ) as Record<keyof BillingDetails, boolean>;
    setTouched(allTouched);

    const required: (keyof BillingDetails)[] = ["name", "line1", "city", "state", "postal_code", "country"];
    if (required.some((f) => billing[f].trim().length < 2)) return;

    setSubmitting(true);
    setError(null);

    try {
      const pkEnv = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
      let publishableKey = pkEnv && !pkEnv.startsWith("pk_test_REPLACE") ? pkEnv : null;
      if (!publishableKey) {
        const { data: cfgData } = await api.get("/stripe/config");
        publishableKey = cfgData.data.publishableKey as string;
      }

      const { data } = await api.post("/stripe/create-subscription-intent", {
        plan_id: Number(planId),
        billing,
      });

      onComplete(data.data as IntentData, loadStripe(publishableKey), billing);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Could not initialise checkout. Please try again.";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <Shield className="size-3" /> Step 1 of 2 — Billing Details
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Who's subscribing?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Required by Indian payment regulations. Your details are sent directly to Stripe.
        </p>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Full Name <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input type="text" autoComplete="name" placeholder="As it appears on your card"
            value={billing.name} onChange={set("name")} onBlur={touch("name")}
            className={fieldClass(invalid("name")) + " pl-10"} />
        </div>
        {invalid("name") && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="size-3" /> Required</p>}
      </div>

      {/* Address line 1 */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Address Line 1 <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input type="text" autoComplete="address-line1" placeholder="House / flat / street"
            value={billing.line1} onChange={set("line1")} onBlur={touch("line1")}
            className={fieldClass(invalid("line1")) + " pl-10"} />
        </div>
        {invalid("line1") && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="size-3" /> Required</p>}
      </div>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            City <span className="text-destructive">*</span>
          </label>
          <input type="text" autoComplete="address-level2" placeholder="City"
            value={billing.city} onChange={set("city")} onBlur={touch("city")}
            className={fieldClass(invalid("city"))} />
          {invalid("city") && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="size-3" /> Required</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            State <span className="text-destructive">*</span>
          </label>
          <select value={billing.state} onChange={set("state")} onBlur={touch("state")}
            className={fieldClass(invalid("state")) + " cursor-pointer"}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {invalid("state") && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="size-3" /> Required</p>}
        </div>
      </div>

      {/* Postal code + Country */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Postal Code <span className="text-destructive">*</span>
          </label>
          <input type="text" autoComplete="postal-code" placeholder="PIN code"
            value={billing.postal_code} onChange={set("postal_code")} onBlur={touch("postal_code")}
            className={fieldClass(invalid("postal_code"))} />
          {invalid("postal_code") && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="size-3" /> Required</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Country</label>
          <select value={billing.country} onChange={set("country")}
            className={fieldClass(false) + " cursor-pointer"}>
            <option value="IN">India</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="AE">UAE</option>
            <option value="SG">Singapore</option>
            <option value="AU">Australia</option>
            <option value="CA">Canada</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      <Button type="submit" disabled={submitting}
        className="h-12 w-full bg-gradient-to-r from-primary to-orange-500 font-semibold text-white border-0 shadow-glow hover:from-primary/90 hover:to-orange-500/90 disabled:opacity-60 text-base">
        {submitting
          ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving details…</>
          : <><ChevronRight className="mr-2 size-4" />Continue to Payment</>}
      </Button>
    </form>
  );
}

// ── Phase 2: Card Payment Form ────────────────────────────────────────────────

interface PaymentFormProps {
  intent: IntentData;
  billing: BillingDetails;
  onBack: () => void;
}

function PaymentForm({ intent, billing, onBack }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Validation failed.");
      setSubmitting(false);
      return;
    }

    const returnUrl = `${window.location.origin}/payment/success?subscription_id=${intent.subscriptionId}&plan_id=${intent.planId}`;

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: {
            name: billing.name,
            address: {
              line1: billing.line1,
              city: billing.city,
              state: billing.state,
              postal_code: billing.postal_code,
              country: billing.country,
            },
          },
        },
      },
    });

    if (confirmError) {
      const msg = confirmError.message ?? "Payment failed. Please try again.";
      setError(msg);
      toast.error("Payment failed", { description: msg });
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <Shield className="size-3" /> Step 2 of 2 — Payment
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Complete your subscription</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Subscribing to <strong className="text-foreground">{intent.planName}</strong>. Enter your card details below.
        </p>
      </div>

      {/* Billing summary pill */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/40 px-4 py-3">
        <div className="flex items-center gap-2.5 text-sm">
          <MapPin className="size-4 text-primary shrink-0" />
          <div>
            <p className="font-medium leading-tight">{billing.name}</p>
            <p className="text-xs text-muted-foreground">{billing.line1}, {billing.city}, {billing.state} {billing.postal_code}</p>
          </div>
        </div>
        <button type="button" onClick={onBack}
          className="text-xs text-primary hover:underline underline-offset-2 shrink-0 ml-3">Edit</button>
      </div>

      {/* Card fields */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Card Details</p>
        <div className={`rounded-xl border border-border/60 bg-[#161929] p-4 transition-all ${!ready ? "min-h-[140px] flex items-center justify-center" : ""}`}>
          {!ready && <Loader2 className="size-6 animate-spin text-primary" />}
          <PaymentElement
            onReady={() => setReady(true)}
            options={{
              layout: "tabs",
              fields: { billingDetails: { name: "never", address: "never" } },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack} disabled={submitting} className="h-12 px-4">
          <ChevronLeft className="size-4" />
        </Button>
        <Button type="submit" disabled={!stripe || !elements || submitting || !ready}
          className="h-12 flex-1 bg-gradient-to-r from-primary to-orange-500 font-semibold text-white border-0 shadow-glow hover:from-primary/90 hover:to-orange-500/90 disabled:opacity-60 text-base">
          {submitting
            ? <><Loader2 className="mr-2 size-4 animate-spin" />Processing payment…</>
            : <><Lock className="mr-2 size-4" />Pay ₹{intent.amount} securely</>}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Shield className="size-3" /> 256-bit SSL</span>
        <span className="size-1 rounded-full bg-border" />
        <span className="flex items-center gap-1"><CreditCard className="size-3" /> Stripe Secured</span>
        <span className="size-1 rounded-full bg-border" />
        <span className="flex items-center gap-1"><Lock className="size-3" /> PCI Compliant</span>
      </div>
    </form>
  );
}

// ── Checkout Inner ────────────────────────────────────────────────────────────

type Phase = "billing" | "payment";

function CheckoutInner({ planId }: { planId: string }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("billing");
  const [intent, setIntent] = useState<IntentData | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [billing, setBilling] = useState<BillingDetails | null>(null);
  const [planData, setPlanData] = useState<{ name: string; amount: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Pre-fetch plan info for the sidebar while user fills billing
  useEffect(() => {
    api.get(`/stripe/plans`)
      .then(({ data }) => {
        const plan = (data.data?.plans ?? []).find((p: { id: number }) => p.id === Number(planId));
        if (plan) setPlanData({ name: plan.name, amount: Number(plan.price) });
      })
      .catch(() => {});
  }, [planId]);

  const handleBillingComplete = useCallback(
    (intentData: IntentData, sp: ReturnType<typeof loadStripe>, billingData: BillingDetails) => {
      setIntent(intentData);
      setStripePromise(sp);
      setBilling(billingData);
      setPhase("payment");
    },
    []
  );

  if (loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="size-12 text-destructive" />
        <div>
          <p className="font-semibold">Checkout unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">{loadError}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/pricing")}>
          <ArrowLeft className="mr-2 size-4" /> Back to Plans
        </Button>
      </div>
    );
  }

  const sidebar = intent ? (
    <PlanSummary intent={intent} />
  ) : planData ? (
    // Skeleton sidebar while on billing step
    <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Your Plan</p>
        <h3 className="text-xl font-bold">{planData.name}</h3>
      </div>
      <div className="rounded-xl border border-border/40 bg-secondary/40 divide-y divide-border/30 overflow-hidden text-sm">
        <div className="flex justify-between items-center bg-secondary/60 px-4 py-3 font-bold">
          <span>Total</span>
          <span className="text-primary text-base">₹{planData.amount}</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {["Cancel anytime", "Full HD 1080p", "No hidden fees"].map((f) => (
          <li key={f} className="flex items-center gap-2 text-muted-foreground">
            <Check className="size-3.5 text-success shrink-0" /> {f}
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/pricing" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Back to plans
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {phase === "billing" && (
            <BillingForm planId={planId} onComplete={handleBillingComplete} />
          )}

          {phase === "payment" && intent && stripePromise && billing && (
            <Elements stripe={stripePromise} options={{ clientSecret: intent.clientSecret, appearance: STRIPE_APPEARANCE, loader: "auto" }}>
              <PaymentForm intent={intent} billing={billing} onBack={() => setPhase("billing")} />
            </Elements>
          )}
        </div>

        <div className="lg:sticky lg:top-24 space-y-4">
          {sidebar}

          <div className="rounded-2xl border border-border/50 bg-card/40 p-5 space-y-3 text-sm">
            {[
              { q: "Can I cancel anytime?", a: "Absolutely. Cancel from your dashboard — no questions asked." },
              { q: "Is my card data safe?", a: "Your card details go directly to Stripe and never touch our servers." },
              { q: "Why do you need my address?", a: "Required by Indian payment regulations (RBI) for all online transactions." },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold flex items-center gap-1.5 text-foreground/80">
                  <ChevronRight className="size-3.5 text-primary shrink-0" />{q}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground pl-5">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Route export ──────────────────────────────────────────────────────────────

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get("plan_id");

  useEffect(() => {
    if (!planId) navigate("/pricing", { replace: true });
  }, [planId, navigate]);

  if (!planId) return null;

  return (
    <Protected>
      <MainLayout>
        <CheckoutInner planId={planId} />
      </MainLayout>
    </Protected>
  );
}
