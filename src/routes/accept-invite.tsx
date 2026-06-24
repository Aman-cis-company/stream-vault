import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { apiClient } from "@/services/api";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)."
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error("Invitation token is missing. Please check your email link.");
      return;
    }
    try {
      await apiClient.post("/team-members/accept-invite", {
        token,
        password: values.password,
      });
      setSuccess(true);
      toast.success("Account activated successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to activate account. The invitation link may have expired or is invalid.";
      toast.error("Activation failed", { description: msg });
    }
  };

  if (!token) {
    return (
      <AuthLayout
        title="Invalid Invitation Link"
        subtitle="We could not verify your team member invitation."
      >
        <div className="rounded-2xl border border-destructive/25 bg-destructive/8 p-8 text-center space-y-4">
          <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-destructive/15 ring-1 ring-destructive/25 text-destructive">
            <AlertTriangle className="size-7" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg">Invalid or Missing Token</h2>
            <p className="mt-1.5 text-sm text-white/50 leading-relaxed">
              Your invitation URL appears to be incomplete or missing the required validation token. Please contact your Super Admin to receive a new invitation link.
            </p>
          </div>
          <Button className="w-full h-11 rounded-xl font-bold shadow-glow-sm" asChild>
            <Link to="/login" className="flex items-center justify-center">
              Go to sign in
            </Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Setup Your Team Account"
      subtitle="Complete your StreamVault staff registration by configuring a secure password."
    >
      {success ? (
        <div className="rounded-2xl border border-success/25 bg-success/8 p-8 text-center space-y-4">
          <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/25 text-success">
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg">Account Activated!</h2>
            <p className="mt-1.5 text-sm text-white/50 leading-relaxed font-medium">
              Your credentials have been securely stored. You will be redirected to the sign in page momentarily.
            </p>
          </div>
          <Button className="w-full h-11 rounded-xl font-bold shadow-glow-sm" asChild>
            <Link to="/login" className="flex items-center justify-center">
              Sign in now
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-white/50"
            >
              Choose Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 rounded-xl border-white/10 bg-white/6 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/8 pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive max-w-sm leading-relaxed">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="confirmPassword"
              className="text-xs font-semibold uppercase tracking-wider text-white/50"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 rounded-xl border-white/10 bg-white/6 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/8 pr-10"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPw ? "Hide password" : "Show password"}
              >
                {showConfirmPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="rounded-lg bg-secondary/30 border border-border/40 p-3 text-left">
            <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider mb-1.5">
              Password Requirements
            </p>
            <ul className="text-[10px] text-muted-foreground space-y-1 font-medium list-disc list-inside">
              <li>Minimum 8 characters in length</li>
              <li>Must contain at least one uppercase character</li>
              <li>Must contain at least one lowercase character</li>
              <li>Must contain at least one numeric character</li>
              <li>Must contain at least one special symbol (@$!%*?&)</li>
            </ul>
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
            {isSubmitting ? "Activating account…" : "Activate Account & Login"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
