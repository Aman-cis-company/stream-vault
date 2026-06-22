import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/services/api";

export type Role =
  | "subscriber"
  | "affiliate"
  | "admin"
  | "super_admin"
  | "team_member";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  plan: string;
  avatarHue: number;
  age_verified?: boolean;
  date_of_birth?: string | null;
  verified_at?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

function mapRole(name: string): Role {
  if (name === "super_admin") return "super_admin";
  if (name === "team_member") return "team_member";
  if (name === "affiliate") return "affiliate";
  return "subscriber";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildUser(u: any): User {
  return {
    id: u.id,
    name: `${u.first_name} ${u.last_name}`.trim(),
    email: u.email,
    role: mapRole(u.role?.name ?? "subscriber"),
    plan: u.plan ?? "Standard",
    avatarHue: Math.floor((u.email.length * 47) % 360),
    age_verified: u.age_verified ?? false,
    date_of_birth: u.date_of_birth ?? null,
    verified_at: u.verified_at ?? null,
  };
}

function persistTokens(access: string, refresh: string) {
  localStorage.setItem("sv.access_token", access);
  localStorage.setItem("sv.refresh_token", refresh);
}

function clearTokens() {
  localStorage.removeItem("sv.access_token");
  localStorage.removeItem("sv.refresh_token");
}

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    { email, password, forceLogout }: { email: string; password: string; forceLogout?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await apiClient.post("/auth/login", { email, password, forceLogout });
      const { user: u, accessToken, refreshToken } = data.data;
      persistTokens(accessToken, refreshToken);
      return { user: buildUser(u), accessToken, refreshToken };
    } catch (err: unknown) {
      const responseData = (err as { response?: { data?: any } })?.response?.data;
      if (responseData && responseData.code === "MAX_SCREENS_EXCEEDED") {
        return rejectWithValue({
          code: "MAX_SCREENS_EXCEEDED",
          message: responseData.message || "your account is loggedin in 2 screen please manage",
          maxScreens: responseData.maxScreens || 2,
        });
      }
      const msg = responseData?.message ?? "Login failed";
      return rejectWithValue(msg);
    }
  }
);

export const phoneLoginThunk = createAsyncThunk(
  "auth/phoneLogin",
  async (
    { user, accessToken, refreshToken }: { user: any; accessToken: string; refreshToken: string },
    { rejectWithValue }
  ) => {
    try {
      persistTokens(accessToken, refreshToken);
      return { user: buildUser(user), accessToken, refreshToken };
    } catch (err: unknown) {
      return rejectWithValue("Failed to set authentication state");
    }
  }
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (
    formData: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      phone?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      await apiClient.post("/auth/register", formData);
      const { data } = await apiClient.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      const { user: u, accessToken, refreshToken } = data.data;
      persistTokens(accessToken, refreshToken);
      return { user: buildUser(u), accessToken, refreshToken };
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Registration failed";
      return rejectWithValue(msg);
    }
  }
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  const refreshToken = localStorage.getItem("sv.refresh_token");
  if (refreshToken) {
    try {
      await apiClient.post("/auth/logout", { refresh_token: refreshToken });
    } catch {
      // clear anyway
    }
  }
  clearTokens();
});

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAgeVerified: (state, { payload }: { payload: { age_verified: boolean; date_of_birth?: string; verified_at?: string } }) => {
      if (state.user) {
        state.user.age_verified = payload.age_verified;
        if (payload.date_of_birth) state.user.date_of_birth = payload.date_of_birth;
        if (payload.verified_at) state.user.verified_at = payload.verified_at;
      }
    },
    // Re-sync localStorage tokens on rehydration
    syncTokens: (state) => {
      if (state.accessToken)
        localStorage.setItem("sv.access_token", state.accessToken);
      if (state.refreshToken)
        localStorage.setItem("sv.refresh_token", state.refreshToken);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.accessToken = payload.accessToken;
        state.refreshToken = payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(phoneLoginThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.accessToken = payload.accessToken;
        state.refreshToken = payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload === "object") {
          state.error = (action.payload as any).message ?? "Login failed";
        } else {
          state.error = (action.payload as string) ?? action.error.message ?? "Login failed";
        }
      })
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.accessToken = payload.accessToken;
        state.refreshToken = payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? action.error.message ?? "Registration failed";
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, syncTokens, setAgeVerified } = authSlice.actions;
export default authSlice.reducer;
