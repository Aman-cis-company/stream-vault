import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { forgotPassword } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await forgotPassword(data.email);
    } catch {
      // Silently ignore — backend always returns success to prevent user enumeration
    } finally {
      setSent(true); // Always show success UI regardless of outcome
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a secure reset link valid for 15 minutes."
    >
      {sent ? (
        <div className="rounded-2xl border border-success/25 bg-success/8 p-8 text-center space-y-4">
          <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/25 text-success">
            <MailCheck className="size-7" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg">Check your inbox</h2>
            <p className="mt-1.5 text-sm text-white/50 leading-relaxed">
              We sent a reset link to{" "}
              <strong className="text-white font-semibold">
                {getValues("email")}
              </strong>
              . Check spam if you don't see it within a few minutes.
            </p>
          </div>
          <Button
            className="w-full h-11 rounded-xl font-bold shadow-glow-sm"
            asChild
          >
            <Link to="/login" className="flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-white/50"
            >
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="h-11 rounded-xl border-white/10 bg-white/6 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/8"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-bold text-sm shadow-glow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 size-4" />
            )}
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-white/40">
              Remembered it?{" "}
              <Link
                to="/login"
                className="font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
