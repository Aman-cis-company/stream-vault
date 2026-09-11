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
import { Smartphone, Monitor, ShieldCheck, Loader2, User, Lock, Laptop, Users, Plus, Edit3 } from "lucide-react";
import { Billing } from "@/components/billing/Billing";
import { useProfile } from "@/context/ProfileContext";
import { PRESET_AVATARS, UserProfile } from "@/lib/profiles";
import { ProfileManagerModal } from "@/components/profiles/ProfileManagerModal";

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
          {/* Sub-Profiles & Kids Mode */}
          <ProfileSubProfilesCard />

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

function ProfileSubProfilesCard() {
  const { profiles, activeProfile, switchProfile } = useProfile();
  const [modalOpen, setModalOpen] = useState(false);
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);

  const handleOpenAdd = () => {
    setTargetProfile(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: UserProfile) => {
    setTargetProfile(p);
    setModalOpen(true);
  };

  return (
    <>
      <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Users className="size-4" />
            </div>
            <h2 className="font-extrabold tracking-tight">Sub-Profiles & Kids Mode</h2>
          </div>
          {profiles.length < 5 && (
            <Button size="sm" onClick={handleOpenAdd} className="h-8 px-3 rounded-lg text-xs font-bold gap-1 bg-primary text-white hover:bg-primary/90">
              <Plus className="size-3.5" /> Add Profile
            </Button>
          )}
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs text-muted-foreground">
            Manage up to 5 individual sub-profiles (Adult, Teen, Kids) with isolated watch history and custom age rating restrictions.
          </p>

          <div className="grid gap-2.5">
            {profiles.map((p) => {
              const preset = PRESET_AVATARS.find((av) => av.id === p.avatar) || PRESET_AVATARS[0];
              const isActive = activeProfile?.id === p.id;
              const isKids = p.is_kids || p.profile_type === "kids";

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isActive ? "border-primary bg-primary/5" : "border-border/60 hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${preset.color} shadow-sm`}>
                      {preset.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{p.name}</span>
                        {isActive && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-bold uppercase">
                            Active
                          </Badge>
                        )}
                        {isKids && (
                          <Badge className="bg-yellow-400/20 text-yellow-500 border-yellow-400/30 text-[9px] font-extrabold uppercase">
                            Kids
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.profile_type.toUpperCase()} • Max Rating: {p.max_rating} {(p.has_pin || (p as any).hasPin) ? "• PIN Locked" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => switchProfile(p)}
                        className="h-8 rounded-lg text-xs font-semibold"
                      >
                        Switch
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(p)}
                      className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ProfileManagerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editProfile={targetProfile}
      />
    </>
  );
}
