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
  const [pin, setPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get("/parental-controls")
      .then(({ data }) => {
        const c = data.data.parental_controls;
        setControls({
          pin_enabled: c.pin_enabled ?? false,
          hide_restricted_content: c.hide_restricted_content ?? false,
          max_rating: c.max_rating ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (controls.pin_enabled && pin) {
      if (pin.length < 4) { toast.error("PIN must be at least 4 digits."); return; }
      if (pin !== confirmPin) { toast.error("PINs do not match."); return; }
    }

    setSaving(true);
    try {
      await apiClient.post("/parental-controls", {
        pin_enabled: controls.pin_enabled,
        pin: pin || undefined,
        current_pin: currentPin || undefined,
        hide_restricted_content: controls.hide_restricted_content,
        max_rating: controls.max_rating || undefined,
      });
      toast.success("Parental controls saved.");
      setPin("");
      setConfirmPin("");
      setCurrentPin("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Failed to save.";
      toast.error(msg);
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
                <div className="space-y-1.5">
                  <Label>Current PIN <span className="text-muted-foreground font-normal">(required to change)</span></Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Current PIN (if already set)"
                  />
                </div>
              </div>
            )}
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
