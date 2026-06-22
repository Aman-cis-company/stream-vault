import { useCallback, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  loginThunk,
  registerThunk,
  logoutThunk,
} from "@/store/slices/authSlice";

// Re-export types for backward compatibility
export type { User, Role } from "@/store/slices/authSlice";

/** No-op wrapper kept for backward compatibility */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * Auth hook — backed by Redux Toolkit + Redux Persist.
 * Same public interface as the previous Context-based implementation.
 */
export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);

  const login = useCallback(
    async (email: string, password: string, forceLogout?: boolean) => {
      return dispatch(loginThunk({ email, password, forceLogout })).unwrap();
    },
    [dispatch]
  );

  const register = useCallback(
    async (data: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      return dispatch(registerThunk(data)).unwrap();
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutThunk());
  }, [dispatch]);

  return { user, isAuthenticated, login, register, logout };
}
