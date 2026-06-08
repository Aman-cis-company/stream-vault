import { Link, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, Play, LayoutDashboard, Loader2, AlertCircle,
  Download, Mail, Tv2, Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type Status = "loading" | "done" | "error";

const NEXT_STEPS = [
  { icon: Mail, text: "Confirmation email sent to your inbox" },
  { icon: Tv2, text: "Stream on up to 2 devices simultaneously" },
  { icon: Download, text: "Download titles for offline viewing" },
  { icon: Sparkles, text: "Access all exclusive StreamVault originals" },
];

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const subscriptionId = searchParams.get("subscription_id");
  const hasParam = !!(sessionId || subscriptionId);
  const [status, setStatus] = useState<Status>(hasParam ? "loading" : "done");
  const [planName, setPlanName] = useState<string>("");
  const calledRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!hasParam || calledRef.current) return;
    calledRef.current = true;

    const request = subscriptionId
      ? api.post("/stripe/activate-subscription", { subscription_id: subscriptionId })
      : api.post("/stripe/fulfill-checkout", { session_id: sessionId });

    request
      .then(({ data }) => {
        const name =
          data.data?.planName ??
          data.data?.subscription?.plan?.name ??
          "";
        if (name) setPlanName(name);
        setStatus("done");
      })
      .catch(() => {
        setStatus("done"); // Non-fatal: webhook may have already fulfilled
      });
  }, [hasParam, sessionId, subscriptionId]);

  if (status === "loading") {
    return (
      <MainLayout>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5">
          <div className="relative">
            <div className="size-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="size-7 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-semibold">Confirming your payment…</p>
            <p className="mt-1 text-sm text-muted-foreground">This only takes a moment</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (status === "error") {
    return (
      <MainLayout>
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="w-full max-w-md text-center space-y-5">
            <span className="inline-flex size-20 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
              <AlertCircle className="size-10 text-destructive" />
            </span>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Confirmation Issue</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your payment may have been processed, but we couldn't confirm it automatically.
                Please check your email or contact support with your session ID.
              </p>
            </div>
            <Button asChild className="shadow-glow">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Success icon with animated ring */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" style={{ animationDuration: "2s" }} />
              <span className="relative inline-flex size-24 items-center justify-center rounded-full bg-success/15 ring-[10px] ring-success/10">
                <CheckCircle className="size-12 text-success" />
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-2 mb-7">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              You're all set! 🎬
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {planName ? (
                <>
                  Your <strong className="text-foreground">{planName}</strong> subscription is active.{" "}
                </>
              ) : (
                "Your subscription is now active. "
              )}
              Welcome to StreamVault — unlimited entertainment awaits.
            </p>
          </div>

          {/* What's included card */}
          <div className="rounded-2xl border border-success/25 bg-success/5 p-5 mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-success/80 mb-3">
              What's included
            </p>
            <ul className="space-y-2.5">
              {NEXT_STEPS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-success/15">
                    <Icon className="size-3.5 text-success" />
                  </span>
                  <span className="text-foreground/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="flex-1 h-12 bg-gradient-to-r from-primary to-orange-500 font-semibold shadow-glow border-0 text-white hover:from-primary/90 hover:to-orange-500/90" asChild>
              <Link to="/browse">
                <Play className="mr-2 size-4 fill-current" />
                Start Watching
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="flex-1 h-12" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="mr-2 size-4" />
                My Dashboard
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Your subscription renews automatically. Manage or cancel anytime from{" "}
            <Link to="/dashboard" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Dashboard → Subscription
            </Link>
            .
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
