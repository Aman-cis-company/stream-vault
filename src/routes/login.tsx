import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
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
import { Eye, EyeOff, Loader2, Phone, Mail, ArrowLeft } from "lucide-react";
import { apiClient } from "@/services/api";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  remember: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, phoneLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const [blockedError, setBlockedError] = useState<{ message: string; maxScreens: number } | null>(null);

  // Phone Login States
  const [loginMode, setLoginMode] = useState<"email" | "phone">("email");
  const [stage, setStage] = useState<"phone" | "otp" | "signup">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneBlockedError, setPhoneBlockedError] = useState<{ message: string; maxScreens: number } | null>(null);

  // Signup fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Support redirect back after login (e.g. from pricing page)
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/dashboard";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (values: FormValues) => {
    setPhoneBlockedError(null);
    try {
      await login(values.email, values.password);
      toast.success("Welcome back!");
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      if (err && err.code === "MAX_SCREENS_EXCEEDED") {
        setPhoneBlockedError(err);
      } else {
        const msg = err?.message ?? "Invalid email or password.";
        toast.error("Login failed", { description: msg });
      }
    }
  };

  // --- Phone Flow Actions ---

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/phone/send-otp", { phone: phone.trim() });
      toast.success("OTP Code Sent!", {
        description: data.data?.otp
          ? `[DEVELOPMENT FALLBACK] OTP Code is: ${data.data.otp}`
          : "An SMS code has been sent to your device.",
      });
      setStage("otp");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to send OTP. Please check the number format.";
      toast.error("Error sending OTP", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent, forceLogout = false) => {
    e?.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }
    setLoading(true);
    setPhoneBlockedError(null);
    try {
      const { data } = await apiClient.post("/auth/phone/verify-otp", {
        phone: phone.trim(),
        otp: otp.trim(),
        forceLogout,
      });

      if (data.data.isNewUser) {
        setSignupToken(data.data.signupToken);
        setStage("signup");
        toast.success("OTP Verified!", { description: "Please complete your account details." });
      } else {
        // Existing user logged in successfully
        const { user, accessToken, refreshToken } = data.data;
        await phoneLogin({ user, accessToken, refreshToken });
        toast.success("Welcome back!");
        navigate(returnTo, { replace: true });
      }
    } catch (err: any) {
      if (err?.response?.data?.code === "MAX_SCREENS_EXCEEDED") {
        setPhoneBlockedError({
          message: err.response.data.message,
          maxScreens: err.response.data.maxScreens,
        });
      } else {
        const msg = err?.response?.data?.message ?? "Invalid or expired OTP code.";
        toast.error("Verification failed", { description: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      toast.error("Please fill in all profile fields");
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/phone/complete-signup", {
        signupToken,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: signupEmail.trim(),
        password: signupPassword.trim(),
      });

      const { user, accessToken, refreshToken } = data.data;
      await phoneLogin({ user, accessToken, refreshToken });
      toast.success("Account created successfully!");
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Registration failed. Try using another email address.";
      toast.error("Registration failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={loginMode === "email" ? "Sign in" : stage === "signup" ? "Finish Setup" : "Sign in with Phone"}
      subtitle={
        loginMode === "email"
          ? "Continue to your StreamVault account."
          : stage === "signup"
          ? "Enter your name, email, and password to finish registration."
          : "We will send a 6-digit OTP code to verify your phone."
      }
    >
      {/* Mode Selector Tabs (only when not in signup stage) */}
      {stage !== "signup" && (
        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-secondary/50 rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => {
              setLoginMode("email");
              setPhoneBlockedError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              loginMode === "email"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="size-3.5" /> Email
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode("phone");
              setPhoneBlockedError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              loginMode === "phone"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="size-3.5" /> Phone Number
          </button>
        </div>
      )}

      {loginMode === "email" ? (
        /* --- Standard Email Form --- */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {phoneBlockedError && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm space-y-3">
              <p className="text-foreground font-semibold text-center">{phoneBlockedError.message}</p>
              <Button
                type="button"
                variant="destructive"
                className="w-full text-xs font-bold py-2 h-9 rounded-lg"
                onClick={async () => {
                  const values = watch();
                  try {
                    await login(values.email, values.password, true);
                    toast.success("Welcome back!");
                    navigate(returnTo, { replace: true });
                  } catch (forceErr: any) {
                    toast.error("Force login failed", { description: forceErr?.message ?? "Error" });
                  }
                }}
              >
                Logout Other Screens
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
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
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={watch("remember")}
              onCheckedChange={(v) => setValue("remember", Boolean(v))}
            />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
              Remember me for 30 days
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Sign in
          </Button>

          {/* <p className="text-center text-xs text-muted-foreground">
            Demo — use <code className="text-foreground">admin@streamvault.com</code> /{" "}
            <code className="text-foreground">Admin@123456</code>
          </p> */}
        </form>
      ) : (
        /* --- Phone Login OTP Flow --- */
        <div className="space-y-5">
          {phoneBlockedError && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm space-y-3">
              <p className="text-foreground font-semibold text-center">{phoneBlockedError.message}</p>
              <Button
                type="button"
                variant="destructive"
                className="w-full text-xs font-bold py-2 h-9 rounded-lg"
                onClick={() => handleVerifyOtp(undefined, true)}
              >
                Logout Other Screens
              </Button>
            </div>
          )}

          {stage === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. +919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Please include your country code (e.g. +91 for India, +1 for US).</p>
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Send Verification OTP
              </Button>
            </form>
          )}

          {stage === "otp" && (
            <form onSubmit={(e) => handleVerifyOtp(e, false)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="rounded-xl tracking-widest text-center text-lg font-bold"
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/3 rounded-xl"
                  onClick={() => setStage("phone")}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-1.5 size-4" /> Back
                </Button>
                <Button type="submit" className="w-2/3 rounded-xl" disabled={loading}>
                  {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Verify & Continue
                </Button>
              </div>
            </form>
          )}

          {stage === "signup" && (
            <form onSubmit={handleCompleteSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signupEmail">Email Address</Label>
                <Input
                  id="signupEmail"
                  type="email"
                  placeholder="yourname@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signupPassword">Password</Label>
                <Input
                  id="signupPassword"
                  type="password"
                  placeholder="Create a strong password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full rounded-xl mt-2" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Complete Setup
              </Button>
            </form>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to StreamVault?{" "}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
