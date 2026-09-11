import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRESET_AVATARS, UserProfile } from "@/lib/profiles";
import { useProfile } from "@/context/ProfileContext";
import { Plus, Lock, Shield, Sparkles, Edit3 } from "lucide-react";
import { ProfileManagerModal } from "./ProfileManagerModal";

interface ProfileSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSelectorModal({ open, onOpenChange }: ProfileSelectorModalProps) {
  const { profiles, activeProfile, switchProfile } = useProfile();
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [pin, setPin] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [editProfileTarget, setEditProfileTarget] = useState<UserProfile | null>(null);

  const handleSelect = async (p: UserProfile) => {
    const hasPin = p.has_pin || (p as any).hasPin;
    if (hasPin) {
      setSelectedProfile(p);
      setPin("");
      setShowPinDialog(true);
    } else {
      await switchProfile(p);
      onOpenChange(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !pin) return;
    const ok = await switchProfile(selectedProfile, pin);
    if (ok) {
      setShowPinDialog(false);
      onOpenChange(false);
    }
  };

  const handleCreateNew = () => {
    setEditProfileTarget(null);
    setShowManagerModal(true);
  };

  const handleEditProfile = (e: React.MouseEvent, p: UserProfile) => {
    e.stopPropagation();
    setEditProfileTarget(p);
    setShowManagerModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl bg-stone-950/95 text-white border-stone-800 backdrop-blur-xl p-8">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-extrabold text-white tracking-tight">
              Who's watching StreamVault?
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-center gap-6 py-6">
            {profiles.map((p) => {
              const preset = PRESET_AVATARS.find((av) => av.id === p.avatar) || PRESET_AVATARS[0];
              const isActive = activeProfile?.id === p.id;
              const isKids = p.is_kids || p.profile_type === "kids";

              return (
                <div key={p.id} className="group relative flex flex-col items-center gap-2.5">
                  <button
                    onClick={() => handleSelect(p)}
                    className={`relative w-24 h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-2xl shadow-black/80 bg-gradient-to-br ${preset.color} ${
                      isActive ? "ring-4 ring-primary scale-105" : "opacity-80 group-hover:opacity-100"
                    }`}
                  >
                    <span className="text-4xl select-none">{preset.icon}</span>

                    {isKids && (
                      <span className="absolute top-1.5 right-1.5 bg-yellow-400 text-stone-950 font-black text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow">
                        Kids
                      </span>
                    )}

                    {p.has_pin && (
                      <span className="absolute bottom-1.5 right-1.5 bg-stone-900/80 text-amber-400 p-1 rounded-md">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold tracking-wide ${isActive ? "text-primary" : "text-stone-300"}`}>
                      {p.name}
                    </span>
                    <button
                      onClick={(e) => handleEditProfile(e, p)}
                      className="text-stone-400 hover:text-white p-1 transition"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {profiles.length < 5 && (
              <div className="flex flex-col items-center gap-2.5">
                <button
                  onClick={handleCreateNew}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-700 hover:border-primary/80 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-900/50 transition-all transform hover:scale-105"
                >
                  <Plus className="w-8 h-8" />
                </button>
                <span className="text-sm font-medium text-stone-400">Add Profile</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Entry Sub-Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="max-w-sm bg-stone-900 text-white border-stone-800 text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              Enter Profile PIN
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePinSubmit} className="space-y-4 py-3">
            <p className="text-xs text-stone-400">
              Profile <strong>{selectedProfile?.name}</strong> is protected with a PIN code.
            </p>
            <Input
              type="password"
              maxLength={4}
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="bg-stone-800 border-stone-700 text-white text-center text-2xl tracking-widest h-12 font-mono"
            />
            <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90">
              Unlock Profile
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manager Modal */}
      <ProfileManagerModal
        open={showManagerModal}
        onOpenChange={setShowManagerModal}
        editProfile={editProfileTarget}
      />
    </>
  );
}
