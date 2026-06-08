import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import {
  RotateCcw, Play, HelpCircle, ShieldCheck,
  Clock, CreditCard, ChevronRight,
} from "lucide-react";

const FAQ = [
  {
    q: "Was my card charged?",
    a: "No. You cancelled before completing the payment. Your account has not been charged.",
  },
  {
    q: "Was a subscription created?",
    a: "No subscription was activated. Your account remains unchanged.",
  },
  {
    q: "Can I try again later?",
    a: "Absolutely — your plan selection will be saved and you can resume anytime.",
  },
];

export default function PaymentCancel() {
  return (
    <MainLayout>
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex size-24 items-center justify-center rounded-full bg-secondary ring-[10px] ring-border/30">
              <Clock className="size-11 text-muted-foreground" />
            </span>
          </div>

          {/* Heading */}
          <div className="text-center space-y-2 mb-7">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Payment Cancelled
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              No worries — you can pick up right where you left off.
              Your account has not been charged.
            </p>
          </div>

          {/* Reassurance strip */}
          <div className="flex items-center justify-center gap-6 mb-7 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="size-4 text-success" />
              No charge made
            </span>
            <span className="size-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CreditCard className="size-4 text-success" />
              Card not stored
            </span>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border border-border bg-card/60 divide-y divide-border/50 overflow-hidden mb-7">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="px-5 py-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <HelpCircle className="size-3.5 shrink-0 text-primary" />
                  {q}
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed pl-5">{a}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="flex-1 h-12 bg-gradient-to-r from-primary to-orange-500 font-semibold shadow-glow border-0 text-white hover:from-primary/90 hover:to-orange-500/90" asChild>
              <Link to="/pricing">
                <RotateCcw className="mr-2 size-4" />
                Try Again
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="flex-1 h-12" asChild>
              <Link to="/browse">
                <Play className="mr-2 size-4" />
                Browse Free
              </Link>
            </Button>
          </div>

          {/* Support link */}
          <div className="mt-6 flex items-center justify-center">
            <Link
              to="/dashboard"
              className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Need help with payment?{" "}
              <span className="text-primary font-medium group-hover:underline underline-offset-2">
                Contact support
              </span>
              <ChevronRight className="size-3 text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
