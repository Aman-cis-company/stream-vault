import axios from "axios";

const BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Attach JWT on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("sv.access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("sv.refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {
            refresh_token: refreshToken,
          });
          const { accessToken, refreshToken: newRefresh } = data.data;
          localStorage.setItem("sv.access_token", accessToken);
          localStorage.setItem("sv.refresh_token", newRefresh);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(original);
        } catch {
          localStorage.removeItem("sv.access_token");
          localStorage.removeItem("sv.refresh_token");
          localStorage.removeItem("sv.auth");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

/** Resolve a relative /uploads path to an absolute backend URL */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const backendBase = BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${backendBase}${path}`;
}

export default apiClient;
