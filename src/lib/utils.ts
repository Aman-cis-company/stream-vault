import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiClient } from "@/services/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}
export async function resetPassword({token, password}: {token: string; password: string}): Promise<void> {
  await apiClient.post('/auth/reset-password', {token,password});
}