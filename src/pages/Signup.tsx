import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(100)
    .regex(/[A-Z]/, "Add an uppercase letter").regex(/[0-9]/, "Add a number"),
  terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
});
type FormValues = z.infer<typeof schema>;

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const COLORS = ["bg-destructive", "bg-destructive", "bg-warning", "bg-warning", "bg-success"];

export default function Signup() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", terms: false as unknown as true },
  });

  const pw = watch("password") ?? "";
  const score = strength(pw);

  const onSubmit = async (values: FormValues) => {
    try {
      const parts = values.name.trim().split(/\s+/);
      const first_name = parts[0];
      const last_name = parts.slice(1).join(" ") || ".";
      await registerUser({ first_name, last_name, email: values.email, password: values.password });
      toast.success("Account created!", { description: "Welcome to StreamVault!" });
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Registration failed. Please try again.";
      toast.error("Sign-up failed", { description: msg });
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start your StreamVault experience today.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Full name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Full name
          </Label>
          <Input
            id="name"
            placeholder="Priya Sharma"
            autoComplete="name"
            className="h-11 rounded-xl border-white/10 bg-white/6 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/8"
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-white/50">
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
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-11 rounded-xl border-white/10 bg-white/6 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/8 pr-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              aria-label="Toggle password"
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {pw && (
            <div className="space-y-1 pt-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? COLORS[score] : "bg-white/10"}`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-white/35">{LABELS[score]}</p>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* Terms */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="terms"
              checked={watch("terms")}
              onCheckedChange={(v) => setValue("terms", Boolean(v) as true, { shouldValidate: true })}
              className="mt-0.5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="terms" className="text-sm font-normal text-white/45 cursor-pointer leading-relaxed">
              I agree to the{" "}
              <span className="text-primary font-semibold hover:text-primary/80 cursor-pointer transition-colors">Terms of Service</span>
              {" "}and{" "}
              <span className="text-primary font-semibold hover:text-primary/80 cursor-pointer transition-colors">Privacy Policy</span>.
            </Label>
          </div>
          {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11 rounded-xl font-bold text-sm shadow-glow-sm mt-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 size-4" />
          )}
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      {/* Sign in link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-white/40">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
