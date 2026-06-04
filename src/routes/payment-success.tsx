import { Link, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle, LayoutDashboard, Play, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type Status = "loading" | "done" | "error";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<Status>(sessionId ? "loading" : "done");
  const [planName, setPlanName] = useState<string>("");
  const calledRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!sessionId || calledRef.current) return;
    calledRef.current = true;

    api
      .post("/stripe/fulfill-checkout", { session_id: sessionId })
      .then(({ data }) => {
        const name = data.data?.subscription?.plan?.name ?? "";
        if (name) setPlanName(name);
        setStatus("done");
      })
      .catch(() => {
        // Non-fatal: fulfillment may have already happened via webhook
        setStatus("done");
      });
  }, [sessionId]);

  return (
    <MainLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        {status === "loading" ? (
          <div className="text-center space-y-4">
            <Loader2 className="size-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Confirming your payment…</p>
          </div>
        ) : status === "error" ? (
          <div className="w-full max-w-md text-center space-y-6">
            <AlertCircle className="size-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              Your payment may have been processed but we couldn't confirm it.
              Please contact support with your session ID.
            </p>
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-md text-center space-y-6">
            <div className="flex justify-center">
              <span className="inline-flex size-24 items-center justify-center rounded-full bg-success/15 ring-8 ring-success/10">
                <CheckCircle className="size-12 text-success" />
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Payment Successful!</h1>
              <p className="text-muted-foreground leading-relaxed">
                {planName ? (
                  <>Your <strong>{planName}</strong> subscription is now active.</>
                ) : (
                  <>Your subscription is now active.</>
                )}{" "}
                Welcome to StreamVault — start watching thousands of titles in stunning 4K HDR.
              </p>
            </div>

            <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm text-left space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="size-4 text-success mt-0.5 shrink-0" />
                <span>A confirmation email has been sent to your inbox.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="size-4 text-success mt-0.5 shrink-0" />
                <span>Your subscription renews automatically — cancel anytime.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="size-4 text-success mt-0.5 shrink-0" />
                <span>Stream on all your devices immediately.</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="shadow-glow">
                <Link to="/browse">
                  <Play className="mr-2 size-5 fill-current" /> Start Watching
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-2 size-4" /> Go to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
