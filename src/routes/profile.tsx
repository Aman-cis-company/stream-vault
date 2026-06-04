import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Smartphone, Monitor, ShieldCheck, Loader2 } from "lucide-react";

export default function ProfilePage() {
  return (
    <Protected>
      <Profile />
    </Protected>
  );
}

const DEVICES = [
  { name: "MacBook Pro", loc: "San Francisco, US", icon: Monitor, current: true },
  { name: "iPhone 15", loc: "San Francisco, US", icon: Smartphone, current: false },
];

function Profile() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api
      .get("/auth/profile")
      .then(({ data }) => {
        const u = data.data.user;
        setFirstName(u.first_name ?? "");
        setLastName(u.last_name ?? "");
        setEmail(u.email ?? "");
      })
      .catch(() => {
        const parts = (user?.name ?? "").split(" ");
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" ") ?? "");
      });
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/auth/profile", { first_name: firstName, last_name: lastName });
      toast.success("Profile saved");
    } catch {
      toast.error("Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw || newPw.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setSavingPw(true);
    try {
      await api.put("/auth/profile", { current_password: currentPw, password: newPw });
      toast.success("Password updated");
      setCurrentPw("");
      setNewPw("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not update password";
      toast.error("Failed", { description: msg });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <DashboardLayout title="Profile & Security">
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Account information</h2>
          <div className="mt-4 flex items-center gap-4">
            <span
              className="inline-flex size-16 items-center justify-center rounded-full text-2xl font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, oklch(0.6 0.2 ${user?.avatarHue ?? 20}), oklch(0.4 0.15 ${((user?.avatarHue ?? 20) + 60) % 360}))`,
              }}
            >
              {(firstName || user?.name || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSaveProfile}>
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Change password</h2>
          <form className="mt-4 grid max-w-md gap-4" onSubmit={handleChangePassword}>
            <div className="space-y-2">
              <Label htmlFor="cur">Current password</Label>
              <Input
                id="cur"
                type="password"
                placeholder="••••••••"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                placeholder="••••••••"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-fit" disabled={savingPw}>
              {savingPw && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-success" />
              <div>
                <h2 className="font-semibold">Two-Factor Authentication</h2>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account.
                </p>
              </div>
            </div>
            <Switch
              onCheckedChange={(v) => toast.success(v ? "2FA enabled" : "2FA disabled")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Device management</h2>
          <div className="mt-4 space-y-3">
            {DEVICES.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <d.icon className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.loc}</p>
                  </div>
                </div>
                {d.current ? (
                  <Badge className="bg-success text-success-foreground">This device</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.success("Device signed out")}
                  >
                    Sign out
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
