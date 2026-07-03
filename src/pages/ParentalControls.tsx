import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Protected } from "@/components/streaming/Protected";
import { apiClient } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShieldCheck, Lock, EyeOff, Loader2 } from "lucide-react";
import type { ContentRating } from "@/lib/mock-data";

const RATINGS: ContentRating[] = ["G", "PG", "PG-13", "16+", "18+", "21+"];

interface Controls {
  pin_enabled: boolean;
  hide_restricted_content: boolean;
  max_rating: ContentRating | null;
}

export default function ParentalControlsPage() {
  return (
    <Protected>
      <ParentalControlsInner />
    </Protected>
  );
}

function ParentalControlsInner() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [controls, setControls] = useState<Controls>({
    pin_enabled: false,
    hide_restricted_content: false,
    max_rating: null,
  });
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for the professional PIN validation modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);

  useEffect(() => {
    apiClient.get("/parental-controls")
      .then(({ data }) => {
        const c = data.data.parental_controls;
        setControls({
          pin_enabled: c.pin_enabled ?? false,
          hide_restricted_content: c.hide_restricted_content ?? false,
          max_rating: c.max_rating ?? null,
        });
        setHasPin(c.pin_enabled ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    const newVal = val.replace(/\D/g, "").slice(-1);
    const nextDigits = [...pinDigits];
    nextDigits[index] = newVal;
    setPinDigits(nextDigits);

    // Auto-focus next input
    if (newVal && index < 3) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  async function handleSave(enteredPin?: string) {
    if (controls.pin_enabled && pin) {
      if (pin.length < 4) { toast.error("PIN must be at least 4 digits."); return; }
      if (pin !== confirmPin) { toast.error("PINs do not match."); return; }
    }

    // If PIN is active on backend and no PIN has been supplied via confirmation modal yet
    if (hasPin && !enteredPin) {
      setPinDigits(["", "", "", ""]);
      setShowPinModal(true);
      // Wait for DOM then focus first box
      setTimeout(() => {
        document.getElementById("pin-input-0")?.focus();
      }, 100);
      return;
    }

    setSaving(true);
    try {
      await apiClient.post("/parental-controls", {
        pin_enabled: controls.pin_enabled,
        pin: pin || undefined,
        current_pin: enteredPin || undefined,
        hide_restricted_content: controls.hide_restricted_content,
        max_rating: controls.max_rating || undefined,
      });
      toast.success("Parental controls saved.");
      setHasPin(controls.pin_enabled);
      setPin("");
      setConfirmPin("");
      setShowPinModal(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Failed to save.";
      toast.error(msg);
      // Clear digits for another try
      if (enteredPin) {
        setPinDigits(["", "", "", ""]);
        setTimeout(() => {
          document.getElementById("pin-input-0")?.focus();
        }, 100);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Parental Controls</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage content restrictions for your account, {user?.name?.split(" ")[0]}.
          </p>
        </div>

        <div className="space-y-6">
          {/* Hide restricted content */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                <EyeOff className="size-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Hide Restricted Content</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Prevent age-restricted titles from appearing in browse and search results.
                </p>
              </div>
              <Switch
                checked={controls.hide_restricted_content}
                onCheckedChange={(v) => setControls({ ...controls, hide_restricted_content: v })}
              />
            </div>
          </div>

          {/* Max rating */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <ShieldCheck className="size-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Maximum Content Rating</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Block content above the selected rating. Leave unset for no restriction.
                </p>
              </div>
            </div>
            <Select
              value={controls.max_rating ?? "none"}
              onValueChange={(v) => setControls({ ...controls, max_rating: v === "none" ? null : v as ContentRating })}
            >
              <SelectTrigger>
                <SelectValue placeholder="No restriction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No restriction</SelectItem>
                {RATINGS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PIN protection */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
                <Lock className="size-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">PIN Protection</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Require a PIN to change parental control settings.
                </p>
              </div>
              <Switch
                checked={controls.pin_enabled}
                onCheckedChange={(v) => setControls({ ...controls, pin_enabled: v })}
              />
            </div>

            {controls.pin_enabled && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="space-y-1.5">
                  <Label>New PIN (min 4 digits)</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter new PIN"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm PIN</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Re-enter PIN"
                  />
                </div>
              </div>
            )}
          </div>

          <Button className="w-full" onClick={() => handleSave()} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Professional verification popup for Current PIN */}
      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="sm:max-w-md bg-popover border border-border text-popover-foreground rounded-2xl shadow-2xl backdrop-blur-md">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Lock className="size-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Verify Parental PIN</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground max-w-xs">
              Please enter your 4-digit parental PIN to authorize and save these changes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-3 py-6">
            {pinDigits.map((digit, idx) => (
              <Input
                key={idx}
                id={`pin-input-${idx}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="size-14 text-center text-xl font-bold rounded-xl bg-foreground/5 border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground dark:bg-white/5 dark:border-white/15 dark:text-white"
              />
            ))}
          </div>

          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowPinModal(false)}
              className="text-foreground hover:text-foreground hover:bg-foreground/5 border border-border dark:text-white dark:hover:text-white dark:hover:bg-white/5 dark:border-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(pinDigits.join(""))}
              disabled={saving || pinDigits.some(d => !d)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-xl"
            >
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Verify & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
