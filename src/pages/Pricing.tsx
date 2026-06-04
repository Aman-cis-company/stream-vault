import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { plans, type Plan } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Shield, Zap, CreditCard, Smartphone, Building2, Loader2 } from "lucide-react";
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
        <div className="text-center">
          <Badge className="mb-4 bg-success/15 text-success border-success/30 hover:bg-success/15">
            7-day free trial
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Choose your plan</h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            One subscription, unlimited entertainment. Switch or cancel anytime. All prices in Indian Rupees (₹).
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all hover:shadow-card-hover ${
                p.highlight
                  ? "border-primary shadow-glow bg-gradient-to-b from-primary/10 to-transparent"
                  : "border-border bg-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-glow-sm">
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-bold">{p.name}</h2>
              <div className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight">₹{p.perMonthInr}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ₹{p.priceInr} billed {p.cadence.toLowerCase()}
              </p>
              <div className="mt-4 rounded-xl bg-secondary/60 px-3 py-2 text-sm">
                <span className="font-semibold">{p.quality}</span>
                <span className="text-muted-foreground"> · {p.screens} screens</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full font-semibold"
                variant={p.highlight ? "default" : "secondary"}
                onClick={() => handleSelect(p)}
              >
                {isAuthenticated ? `Subscribe — ₹${p.priceInr}` : "Start Free Trial"}
              </Button>
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Shield, title: "Secure Payments", desc: "256-bit SSL encryption. Powered by Razorpay — trusted by 8M+ businesses." },
            { icon: Zap, title: "Instant Activation", desc: "Your plan activates immediately after payment. Start streaming in seconds." },
            { icon: Check, title: "Cancel Anytime", desc: "No contracts. Cancel from your dashboard with one click — no questions asked." },
          ].map((t) => (
            <div key={t.title} className="rounded-xl border border-border bg-card/60 p-5 flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <t.icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Razorpay-style payment dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-md">
          {step === "success" ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-success/15">
                <Check className="size-8 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Payment Successful!</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  ₹{selected?.priceInr} charged. Your {selected?.name} plan is now active.
                </p>
              </div>
              <Button className="w-full" onClick={handleClose}>Go to Dashboard</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base">StreamVault Checkout</DialogTitle>
                    <p className="text-xs text-muted-foreground">Secured by Razorpay</p>
                  </div>
                </div>
                <DialogDescription>
                  <div className="rounded-lg bg-secondary/50 border border-border p-3 text-sm mt-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium">{selected?.name} ({selected?.cadence})</span></div>
                    <div className="flex justify-between mt-1.5"><span className="text-muted-foreground">Quality</span><span>{selected?.quality}</span></div>
                    <div className="flex justify-between mt-1.5 pt-1.5 border-t border-border"><span className="font-semibold text-foreground">Total</span><span className="font-bold text-foreground">₹{selected?.priceInr}</span></div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition-all ${
                        payMethod === m.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-border/80"
                      }`}
                    >
                      <m.icon className="size-5" />
                      <span className="font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>

                {payMethod === "upi" && (
                  <div className="space-y-2">
                    <Label htmlFor="upi">UPI ID</Label>
                    <Input id="upi" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                    <p className="text-xs text-muted-foreground">e.g. 9876543210@paytm, user@okicici</p>
                  </div>
                )}
                {payMethod === "card" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <Input placeholder="4111 1111 1111 1111" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>Expiry</Label><Input placeholder="MM/YY" /></div>
                      <div className="space-y-2"><Label>CVV</Label><Input placeholder="•••" type="password" maxLength={4} /></div>
                    </div>
                  </div>
                )}
                {payMethod === "netbanking" && (
                  <div className="grid grid-cols-3 gap-2">
                    {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Other"].map((b) => (
                      <button key={b} className="rounded-lg border border-border p-2 text-xs font-medium hover:border-primary/50 hover:bg-primary/10 transition-colors">{b}</button>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
                <Button onClick={handlePay} disabled={paying} className="min-w-[140px]">
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
