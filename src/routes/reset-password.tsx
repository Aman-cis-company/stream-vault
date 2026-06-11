import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "@/lib/utils";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Invalid / missing token — show error immediately
  if (!token) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="This link is missing a token. Please request a new one."
      >
        <Button className="w-full h-11 rounded-xl font-bold shadow-glow-sm" asChild>
          <Link to="/forgot-password" className="flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Request a new link
          </Link>
        </Button>
      </AuthLayout>
    );
  }

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    try {
      await resetPassword({ token, password: data.password });
      setDone(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.errors[0]?.message || err?.response?.data?.message ||
        "This link has expired or is invalid. Please request a new one.";
      setServerError(message);
    }
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your StreamVault account."
    >
      {done ? (
        // ── Success state ──────────────────────────────────────────
        <div className="rounded-2xl border border-success/25 bg-success/8 p-8 text-center space-y-4">
          <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/25 text-success">
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg">Password updated!</h2>
            <p className="mt-1.5 text-sm text-white/50 leading-relaxed">
              Your password has been changed successfully. You can now sign in
              with your new password.
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
        // ── Form ───────────────────────────────────────────────────
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

          {/* Server error banner */}
          {serverError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
              {" "}
              <Link
                to="/forgot-password"
                className="font-bold underline underline-offset-2 hover:opacity-80"
              >
                Request a new link
              </Link>
            </div>
          )}

          {/* New password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-white/50"
            >
              New password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 rounded-xl border-white/10 bg-white/6 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/8 pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="confirmPassword"
              className="text-xs font-semibold uppercase tracking-wider text-white/50"
            >
              Confirm password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 rounded-xl border-white/10 bg-white/6 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/8 pr-11"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
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
            {isSubmitting ? "Updating…" : "Update password"}
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