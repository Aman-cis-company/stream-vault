import { api } from "./api";

export interface UserProfile {
  id: number;
  user_id: number;
  name: string;
  avatar: string;
  profile_type: "adult" | "teen" | "kids";
  is_kids: boolean;
  max_rating: "G" | "PG" | "PG-13" | "16+" | "18+" | "21+";
  is_default: boolean;
  has_pin?: boolean;
}

export const PRESET_AVATARS = [
  { id: "avatar_1", name: "Red Vault", color: "from-red-600 to-rose-900", icon: "🍿" },
  { id: "avatar_2", name: "Purple Neon", color: "from-purple-600 to-indigo-900", icon: "🎧" },
  { id: "avatar_3", name: "Cyan Cyber", color: "from-cyan-500 to-blue-900", icon: "🚀" },
  { id: "avatar_4", name: "Golden Star", color: "from-amber-400 to-orange-700", icon: "⭐" },
  { id: "avatar_kids_1", name: "Kids Panda", color: "from-emerald-400 to-teal-700", icon: "🐼", isKids: true },
  { id: "avatar_kids_2", name: "Kids Lion", color: "from-yellow-400 to-amber-600", icon: "🦁", isKids: true },
  { id: "avatar_kids_3", name: "Kids Rocket", color: "from-sky-400 to-indigo-600", icon: "🎨", isKids: true },
  { id: "avatar_kids_4", name: "Kids Unicorn", color: "from-pink-400 to-purple-600", icon: "🦄", isKids: true },
];

export async function fetchUserProfiles(): Promise<UserProfile[]> {
  const res = await api.get("/profiles");
  return res.data.data.profiles || [];
}

export async function createUserProfile(data: {
  name: string;
  avatar?: string;
  profile_type?: "adult" | "teen" | "kids";
  is_kids?: boolean;
  max_rating?: string;
  pin?: string;
}): Promise<UserProfile> {
  const res = await api.post("/profiles", data);
  return res.data.data.profile;
}

export async function updateUserProfile(
  id: number,
  data: {
    name?: string;
    avatar?: string;
    profile_type?: "adult" | "teen" | "kids";
    is_kids?: boolean;
    max_rating?: string;
    pin?: string;
    remove_pin?: boolean;
  }
): Promise<UserProfile> {
  const res = await api.put(`/profiles/${id}`, data);
  return res.data.data.profile;
}

export async function deleteUserProfile(id: number): Promise<void> {
  await api.delete(`/profiles/${id}`);
}

export async function verifyProfilePin(id: number, pin: string): Promise<boolean> {
  const res = await api.post(`/profiles/${id}/verify-pin`, { pin });
  return Boolean(res.data.verified);
}

const RATING_HIERARCHY = ["G", "PG", "PG-13", "16+", "18+", "21+"];

export function filterTitlesForActiveProfile<
  T extends {
    content_rating?: string | null;
    is_age_restricted?: boolean | null;
    maturity?: string | null;
  }
>(items: T[], activeProfile: UserProfile | null): T[] {
  if (!items || !Array.isArray(items)) return [];
  if (!activeProfile) return items;

  const isKids = activeProfile.is_kids || activeProfile.profile_type === "kids";
  const maxRating =
    activeProfile.max_rating ||
    (isKids ? "PG" : activeProfile.profile_type === "teen" ? "PG-13" : "21+");

  if (maxRating === "21+" && !isKids) return items;

  const maxIdx = RATING_HIERARCHY.indexOf(maxRating.toUpperCase());

  return items.filter((item) => {
    // 1. Kids profile check
    if (isKids) {
      if (item.is_age_restricted) return false;
      const r = (
        item.content_rating ||
        (item.maturity === "A" ? "18+" : item.maturity === "UA" ? "PG-13" : "G")
      ).toUpperCase();
      if (r === "18+" || r === "21+" || r === "16+") return false;
      if (maxRating === "PG" && r === "PG-13") return false;
      if (maxRating === "G" && (r === "PG" || r === "PG-13")) return false;
      return true;
    }

    // 2. Max rating limit check
    if (maxIdx !== -1) {
      const r = (
        item.content_rating ||
        (item.maturity === "A" ? "18+" : item.maturity === "UA" ? "PG-13" : "G")
      ).toUpperCase();
      const contentIdx = RATING_HIERARCHY.indexOf(r);
      if (contentIdx !== -1 && contentIdx > maxIdx) {
        return false;
      }
    }
    return true;
  });
}
