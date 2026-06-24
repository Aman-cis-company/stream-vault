import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Smartphone, Monitor, ShieldCheck, Loader2, User, Lock, Laptop } from "lucide-react";
import { Billing } from "@/components/billing/Billing";

export default function ProfilePage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "profile";

  return (
    <Protected>
      {tab === "billing" ? <Billing /> : <Profile />}
    </Protected>
  );
}

const DEVICES = [
  { name: "MacBook Pro", loc: "San Francisco, US", icon: Laptop, current: true },
  { name: "iPhone 15", loc: "San Francisco, US", icon: Smartphone, current: false },
  { name: "Windows PC", loc: "Mumbai, IN", icon: Monitor, current: false },
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

  const initials = (firstName || user?.name || "U").charAt(0).toUpperCase();
  const hue = user?.avatarHue ?? 20;

  return (
    <DashboardLayout title="Profile & Security">
      <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
        <div className="space-y-6">
          {/* Account info card */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
            {/* Card header */}
            <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
              <div className="inline-flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <User className="size-4" />
              </div>
              <h2 className="font-extrabold tracking-tight">Account Information</h2>
            </div>

            <div className="p-6">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="inline-flex size-16 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4)] ring-2 ring-white/10"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.6 0.22 ${hue}), oklch(0.42 0.18 ${(hue + 60) % 360}))`,
                  }}
                >
                  {initials}
                </div>
                <div>
                  <p className="font-extrabold text-base">{firstName} {lastName}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
                  <Badge className="mt-1.5 bg-primary/15 text-primary border-primary/30 text-[10px] font-bold uppercase tracking-wider">
                    {user?.role ?? "Subscriber"}
                  </Badge>
                </div>
              </div>

              <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSaveProfile}>
                <div className="space-y-1.5">
                  <Label htmlFor="first_name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    First name
                  </Label>
                  <Input
                    id="first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Last name
                  </Label>
                  <Input
                    id="last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="h-10 rounded-xl opacity-50 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">Contact support to change your email.</p>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={savingProfile} className="h-10 rounded-xl font-bold">
                    {savingProfile && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save changes
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Device management */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
              <div className="inline-flex size-8 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                <Laptop className="size-4" />
              </div>
              <h2 className="font-extrabold tracking-tight">Device Management</h2>
            </div>
            <div className="divide-y divide-border/40">
              {DEVICES.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between px-6 py-4 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex size-9 items-center justify-center rounded-xl bg-secondary/60">
                      <d.icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{d.loc}</p>
                    </div>
                  </div>
                  {d.current ? (
                    <Badge className="bg-success/15 text-success border-success/30 text-[10px] font-bold uppercase tracking-wider">
                      This device
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.success("Device signed out")}
                      className="rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      Sign out
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Change password */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
              <div className="inline-flex size-8 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <Lock className="size-4" />
              </div>
              <h2 className="font-extrabold tracking-tight">Change Password</h2>
            </div>
            <div className="p-6">
              <form className="grid gap-4 w-full" onSubmit={handleChangePassword}>
                <div className="space-y-1.5">
                  <Label htmlFor="cur" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Current password
                  </Label>
                  <Input
                    id="cur"
                    type="password"
                    placeholder="••••••••"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    New password
                  </Label>
                  <Input
                    id="new"
                    type="password"
                    placeholder="••••••••"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <Button type="submit" className="w-fit h-10 rounded-xl font-bold" disabled={savingPw}>
                  {savingPw && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            </div>
          </div>

          {/* 2FA */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex size-10 items-center justify-center rounded-xl bg-success/15 text-success ring-1 ring-success/20">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h2 className="font-extrabold tracking-tight">Two-Factor Authentication</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Add an extra layer of security to your account.
                  </p>
                </div>
              </div>
              <Switch
                onCheckedChange={(v) => toast.success(v ? "2FA enabled" : "2FA disabled")}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
