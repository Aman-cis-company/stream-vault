import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { plans, type Plan } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  Shield,
  Zap,
  CreditCard,
  Smartphone,
  Building2,
  Loader2,
  Star,
  X,
  Sparkles,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: Smartphone, desc: "PhonePe, GPay, Paytm, BHIM" },
  { id: "card", label: "Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking", icon: Building2, desc: "All major Indian banks" },
];

const TRUST = [
  {
    icon: Shield,
    title: "Secure Payments",
    desc: "256-bit SSL encryption. Powered by Razorpay — trusted by 8M+ businesses.",
  },
  {
    icon: Zap,
    title: "Instant Activation",
    desc: "Your plan activates immediately after payment. Start streaming in seconds.",
  },
  {
    icon: Check,
    title: "Cancel Anytime",
    desc: "No contracts. Cancel from your dashboard with one click — no questions asked.",
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [payMethod, setPayMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState<"select" | "pay" | "success">("select");

  const handleSelect = (p: Plan) => {
    if (!isAuthenticated) { navigate("/signup"); return; }
    setSelected(p);
    setStep("select");
  };

  const handlePay = async () => {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1800));
    setPaying(false);
    setStep("success");
  };

  const handleClose = () => {
    if (step === "success") {
      toast.success(`Subscribed to ${selected?.name}!`, { description: "Your plan is now active. Enjoy streaming." });
      navigate("/dashboard");
    }
    setSelected(null);
    setStep("select");
    setUpiId("");
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-success/12 text-success border-success/30 hover:bg-success/12 px-4 py-1 text-xs font-bold uppercase tracking-widest">
            7-day free trial
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-[-0.02em] sm:text-5xl">
            Choose your plan
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
            One subscription, unlimited entertainment. Switch or cancel anytime.
            All prices in Indian Rupees (₹).
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <div
              key={p.id}
              className={`group relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                p.highlight
                  ? "border-primary/50 shadow-glow bg-gradient-to-b from-primary/10 via-primary/4 to-transparent"
                  : "border-border/60 bg-card hover:border-border hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {p.highlight && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-1.5 text-xs font-bold text-primary-foreground shadow-glow-sm">
                    <Sparkles className="size-3" /> Most Popular
                  </span>
                </div>
              )}

              {/* Plan name */}
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-extrabold">{p.name}</h2>
                {p.highlight && (
                  <div className="flex gap-0.5">
                    {[0,1,2].map(i => <Star key={i} className="size-3 fill-warning text-warning" />)}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-extrabold tracking-tight">₹{p.perMonthInr}</span>
                <span className="mb-1 text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ₹{p.priceInr} billed {p.cadence.toLowerCase()}
              </p>

              {/* Quality badge */}
              <div className="mt-5 rounded-xl border border-border/50 bg-secondary/40 px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-bold">{p.quality}</span>
                <span className="text-xs text-muted-foreground">{p.screens} screens</span>
              </div>

              {/* Features */}
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm">
                    <div className="mt-0.5 shrink-0 size-4 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
                      <Check className="size-2.5 text-success" strokeWidth={3} />
                    </div>
                    <span className="text-foreground/85">{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={`mt-8 w-full h-11 font-bold text-sm rounded-xl ${
                  p.highlight ? "shadow-glow-sm" : ""
                }`}
                variant={p.highlight ? "default" : "secondary"}
                onClick={() => handleSelect(p)}
              >
                {isAuthenticated ? `Subscribe — ₹${p.priceInr}` : "Start Free Trial"}
              </Button>
            </div>
          ))}
        </div>

        {/* Trial note */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          All plans include a 7-day free trial — no credit card required. Cancel before your trial ends and you won't be charged.
        </p>

        {/* Trust signals */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="rounded-2xl border border-border/50 bg-card/50 p-5 flex items-start gap-3.5">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                <t.icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold">{t.title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-md rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
          {step === "success" ? (
            <div className="py-8 text-center space-y-5">
              <div className="mx-auto inline-flex size-20 items-center justify-center rounded-full bg-success/12 ring-1 ring-success/25">
                <Check className="size-9 text-success" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">Payment Successful!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  ₹{selected?.priceInr} charged. Your {selected?.name} plan is now active.
                </p>
              </div>
              <Button className="w-full h-11 font-bold rounded-xl shadow-glow-sm" onClick={handleClose}>
                Start Watching
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow-sm">
                      <Shield className="size-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold">StreamVault Checkout</DialogTitle>
                      <p className="text-xs text-muted-foreground">Secured by Razorpay · SSL encrypted</p>
                    </div>
                  </div>
                </div>

                <DialogDescription asChild>
                  <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-sm mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-semibold text-foreground">{selected?.name} ({selected?.cadence})</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Quality</span>
                      <span className="text-foreground">{selected?.quality}</span>
                    </div>
                    <div className="h-px bg-border/50 my-1" />
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-extrabold text-lg">₹{selected?.priceInr}</span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Payment method selector */}
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition-all duration-200 ${
                        payMethod === m.id
                          ? "border-primary/50 bg-primary/10 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                          : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <m.icon className="size-4.5" />
                      <span className="font-semibold">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Payment form fields */}
                {payMethod === "upi" && (
                  <div className="space-y-2">
                    <Label htmlFor="upi" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UPI ID</Label>
                    <Input id="upi" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="h-10 rounded-xl" />
                    <p className="text-[11px] text-muted-foreground">e.g. 9876543210@paytm · user@okicici</p>
                  </div>
                )}
                {payMethod === "card" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card Number</Label>
                      <Input placeholder="4111 1111 1111 1111" className="h-10 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiry</Label>
                        <Input placeholder="MM/YY" className="h-10 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVV</Label>
                        <Input placeholder="•••" type="password" maxLength={4} className="h-10 rounded-xl" />
                      </div>
                    </div>
                  </div>
                )}
                {payMethod === "netbanking" && (
                  <div className="grid grid-cols-3 gap-2">
                    {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Other"].map((b) => (
                      <button
                        key={b}
                        className="rounded-xl border border-border/50 p-2.5 text-xs font-semibold hover:border-primary/40 hover:bg-primary/8 hover:text-primary transition-all"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setSelected(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handlePay}
                  disabled={paying}
                  className="min-w-[150px] h-10 font-bold rounded-xl shadow-glow-sm"
                >
                  {paying ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Processing…</>
                  ) : (
                    <>Pay ₹{selected?.priceInr}</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
