import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PRESET_AVATARS, UserProfile, createUserProfile, updateUserProfile, deleteUserProfile } from "@/lib/profiles";
import { useProfile } from "@/context/ProfileContext";
import { ShieldAlert, Trash2, Lock } from "lucide-react";

interface ProfileManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProfile?: UserProfile | null;
}

export function ProfileManagerModal({ open, onOpenChange, editProfile }: ProfileManagerModalProps) {
  const { refetchProfiles } = useProfile();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("avatar_1");
  const [profileType, setProfileType] = useState<"adult" | "teen" | "kids">("adult");
  const [isKids, setIsKids] = useState(false);
  const [maxRating, setMaxRating] = useState<string>("21+");
  const [pin, setPin] = useState("");
  const [enablePin, setEnablePin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editProfile) {
      setName(editProfile.name);
      setAvatar(editProfile.avatar || "avatar_1");
      setProfileType(editProfile.profile_type || "adult");
      setIsKids(editProfile.is_kids || editProfile.profile_type === "kids");
      setMaxRating(editProfile.max_rating || "21+");
      setEnablePin(Boolean(editProfile.has_pin));
      setPin("");
    } else {
      setName("");
      setAvatar("avatar_1");
      setProfileType("adult");
      setIsKids(false);
      setMaxRating("21+");
      setEnablePin(false);
      setPin("");
    }
  }, [editProfile, open]);

  const handleTypeChange = (val: "adult" | "teen" | "kids") => {
    setProfileType(val);
    if (val === "kids") {
      setIsKids(true);
      setMaxRating("PG");
      setAvatar("avatar_kids_1");
    } else if (val === "teen") {
      setIsKids(false);
      setMaxRating("PG-13");
      setAvatar("avatar_2");
    } else {
      setIsKids(false);
      setMaxRating("21+");
      setAvatar("avatar_1");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Profile name is required");
      return;
    }

    setLoading(true);
    try {
      if (editProfile) {
        await updateUserProfile(editProfile.id, {
          name: name.trim(),
          avatar,
          profile_type: profileType,
          is_kids: isKids,
          max_rating: maxRating,
          pin: enablePin ? pin : undefined,
          remove_pin: !enablePin,
        });
        toast.success("Profile updated");
      } else {
        await createUserProfile({
          name: name.trim(),
          avatar,
          profile_type: profileType,
          is_kids: isKids,
          max_rating: maxRating,
          pin: enablePin ? pin : undefined,
        });
        toast.success("New profile created");
      }
      await refetchProfiles();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editProfile) return;
    if (confirm(`Are you sure you want to delete profile "${editProfile.name}"?`)) {
      setLoading(true);
      try {
        await deleteUserProfile(editProfile.id);
        toast.success("Profile deleted");
        await refetchProfiles();
        onOpenChange(false);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Could not delete profile");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-stone-900 text-white border-stone-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            {editProfile ? "Edit Profile" : "Add Sub-Profile"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Avatar selector */}
          <div className="space-y-2">
            <Label className="text-stone-300 text-xs font-semibold uppercase tracking-wider">Choose Avatar</Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AVATARS.map((av) => {
                const selected = avatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatar(av.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all bg-gradient-to-br ${av.color} ${
                      selected ? "ring-2 ring-primary border-primary scale-105" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <span className="text-2xl">{av.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Name */}
          <div className="space-y-1.5">
            <Label htmlFor="prof-name" className="text-stone-300">Profile Name</Label>
            <Input
              id="prof-name"
              placeholder="e.g. Alex or Kids"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-stone-800 border-stone-700 text-white"
            />
          </div>

          {/* Profile Type */}
          <div className="space-y-1.5">
            <Label className="text-stone-300">Profile Category / Maturity</Label>
            <Select value={profileType} onValueChange={(val: any) => handleTypeChange(val)}>
              <SelectTrigger className="bg-stone-800 border-stone-700 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-stone-800 border-stone-700 text-white">
                <SelectItem value="adult">Adult (All Content & Unrestricted)</SelectItem>
                <SelectItem value="teen">Teen (Filtered PG-13 Content)</SelectItem>
                <SelectItem value="kids">Kids Experience (Safe Family & Kids Content)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Age Rating Limit */}
          <div className="space-y-1.5">
            <Label className="text-stone-300">Max Allowed Content Rating</Label>
            <Select value={maxRating} onValueChange={setMaxRating}>
              <SelectTrigger className="bg-stone-800 border-stone-700 text-white">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent className="bg-stone-800 border-stone-700 text-white">
                <SelectItem value="G">G - General Audiences</SelectItem>
                <SelectItem value="PG">PG - Parental Guidance</SelectItem>
                <SelectItem value="PG-13">PG-13 - Parents Strongly Cautioned</SelectItem>
                <SelectItem value="16+">16+ - Recommended for 16 and over</SelectItem>
                <SelectItem value="18+">18+ - Adult Content</SelectItem>
                <SelectItem value="21+">21+ - Unrestricted Full Catalog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional PIN Lock */}
          <div className="pt-2 border-t border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-stone-200 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  PIN Lock Protection
                </div>
                <div className="text-xs text-stone-400">Require 4-digit PIN to switch to this profile</div>
              </div>
              <Switch checked={enablePin} onCheckedChange={setEnablePin} />
            </div>

            {enablePin && (
              <div className="space-y-1.5">
                <Input
                  type="password"
                  maxLength={4}
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="bg-stone-800 border-stone-700 text-white tracking-widest text-center text-lg"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 flex gap-2">
            {editProfile && !editProfile.is_default && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={loading}>
              {loading ? "Saving..." : editProfile ? "Save Changes" : "Create Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
