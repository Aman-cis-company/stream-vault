import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  UserProfile,
  fetchUserProfiles,
  verifyProfilePin,
} from "@/lib/profiles";
import { toast } from "sonner";

interface ProfileContextType {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  loadingProfiles: boolean;
  isKidsMode: boolean;
  refetchProfiles: () => Promise<void>;
  setActiveProfile: (profile: UserProfile) => void;
  switchProfile: (profile: UserProfile, pin?: string) => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<UserProfile | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(false);

  const refetchProfiles = async () => {
    if (!isAuthenticated) {
      setProfiles([]);
      setActiveProfileState(null);
      localStorage.removeItem("sv.active_profile_id");
      return;
    }

    try {
      setLoadingProfiles(true);
      const list = await fetchUserProfiles();
      setProfiles(list);

      const storedId = localStorage.getItem("sv.active_profile_id");
      let current: UserProfile | undefined;

      if (storedId) {
        current = list.find((p) => p.id === Number(storedId));
      }

      if (!current && list.length > 0) {
        current = list.find((p) => p.is_default) || list[0];
      }

      if (current) {
        setActiveProfileState(current);
        localStorage.setItem("sv.active_profile_id", String(current.id));
      }
    } catch (err) {
      console.error("Failed to load user sub-profiles:", err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    refetchProfiles();
  }, [isAuthenticated]);

  const setActiveProfile = (profile: UserProfile) => {
    setActiveProfileState(profile);
    localStorage.setItem("sv.active_profile_id", String(profile.id));
  };

  const switchProfile = async (profile: UserProfile, pin?: string): Promise<boolean> => {
    const hasPin = profile.has_pin || (profile as any).hasPin;
    if (hasPin) {
      if (!pin) {
        toast.error("PIN code required for this profile");
        return false;
      }
      try {
        const verified = await verifyProfilePin(profile.id, pin);
        if (!verified) {
          toast.error("Incorrect PIN code");
          return false;
        }
      } catch {
        toast.error("PIN verification failed");
        return false;
      }
    }
    setActiveProfile(profile);
    toast.success(`Switched to profile: ${profile.name}`);
    setTimeout(() => {
      window.location.reload();
    }, 300);
    return true;
  };

  const isKidsMode = activeProfile?.is_kids || activeProfile?.profile_type === "kids";

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        loadingProfiles,
        isKidsMode,
        refetchProfiles,
        setActiveProfile,
        switchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
