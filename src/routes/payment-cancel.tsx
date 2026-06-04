import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { XCircle, RotateCcw, HelpCircle } from "lucide-react";

export default function PaymentCancel() {
  return (
    <MainLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <span className="inline-flex size-24 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
              <XCircle className="size-12 text-destructive" />
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Payment Cancelled</h1>
            <p className="text-muted-foreground leading-relaxed">
              No charge was made to your card. You can go back and choose a plan
              whenever you're ready.
            </p>
          </div>

          {/* Info card */}
          <div className="rounded-xl border border-border bg-card/60 p-4 text-sm text-left space-y-2">
            <p className="font-medium">What happened?</p>
            <p className="text-muted-foreground">
              You cancelled before completing the payment. Your account has not been charged
              and no subscription was created.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="shadow-glow">
              <Link to="/pricing">
                <RotateCcw className="mr-2 size-4" /> Try Again
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/browse">
                <HelpCircle className="mr-2 size-4" /> Browse Free Content
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
