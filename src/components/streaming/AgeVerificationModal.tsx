import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { setAgeVerified } from "@/store/slices/authSlice";
import { apiClient } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function calcAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function AgeVerificationModal() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);

  const needsVerification = isAuthenticated && user && !user.age_verified;

  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!needsVerification) return null;

  const maxDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 5);
    return d.toISOString().split("T")[0];
  })();

  async function handleVerify() {
    if (!dob) { setError("Please enter your date of birth."); return; }

    const age = calcAge(dob);
    if (age < 18) {
      setError("You must be at least 18 years old to use StreamVault.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.post("/age/verify", { date_of_birth: dob });
      dispatch(setAgeVerified({
        age_verified: true,
        date_of_birth: dob,
        verified_at: data.data.verified_at,
      }));
      toast.success("Age verified successfully.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Verification failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/15">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Age Verification Required</DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground leading-relaxed">
          StreamVault contains content for adults. Please confirm your age to
          continue. This is a one-time verification stored securely.
        </p>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              max={maxDate}
              onChange={(e) => { setDob(e.target.value); setError(""); }}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <Button className="w-full" onClick={handleVerify} disabled={loading || !dob}>
            {loading ? "Verifying…" : "Confirm Age & Continue"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you confirm you are 18 years or older and agree to our terms.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
