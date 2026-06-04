import { apiClient, assetUrl } from "@/services/api";
import type { Title } from "@/lib/mock-data";
import type { BackendMovie } from "@/store/slices/moviesSlice";

export function mapMovieToTitle(movie: BackendMovie): Title {
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : 2024;
  const hue =
    Array.from(movie.title).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    360;

  const poster = movie.thumbnail_url
    ? assetUrl(movie.thumbnail_url)
    : `https://picsum.photos/seed/${movie.slug ?? movie.id}/342/513`;

  const backdrop = movie.thumbnail_url
    ? assetUrl(movie.thumbnail_url)
    : `https://picsum.photos/seed/${movie.slug ?? movie.id}-bg/780/440`;

  return {
    id: String(movie.id),
    name: movie.title,
    category: (movie.category?.name ?? "Recommended") as
      | "Trending"
      | "New Releases"
      | "Most Watched"
      | "Recommended",
    genres: [],
    year,
    durationMin: movie.duration ? Math.round(movie.duration / 60) : 90,
    maturity: movie.content_rating ?? "PG-13",
    rating: 0,
    hue,
    synopsis: movie.description ?? "",
    trending: movie.is_featured,
    newRelease: movie.status === "published" && !!movie.release_date &&
      new Date(movie.release_date) > new Date(Date.now() - 30 * 24 * 3600 * 1000),
    posterUrl: poster,
    backdropUrl: backdrop,
    director: "",
    cast: [],
    hlsUrl: movie.video_url ? assetUrl(movie.video_url) : "",
    language: movie.language ?? "English",
    content_rating: movie.content_rating ?? null,
    is_age_restricted: movie.is_age_restricted ?? false,
    minimum_age: movie.minimum_age ?? null,
    warning_flags_json: movie.warning_flags_json ?? null,
  };
}

export async function fetchMovies(params?: {
  status?: string;
  limit?: number;
  categoryId?: number;
}): Promise<Title[]> {
  const q = new URLSearchParams();
  q.set("status", params?.status ?? "published");
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.categoryId) q.set("category_id", String(params.categoryId));
  else q.set("limit", "100");
  const { data } = await apiClient.get(`/movies?${q}`);
  return (data.data.movies as BackendMovie[]).map(mapMovieToTitle);
}

export async function fetchMovieById(id: string): Promise<Title | null> {
  try {
    const { data } = await apiClient.get(`/movies/${id}`);
    return mapMovieToTitle(data.data.movie as BackendMovie);
  } catch {
    return null;
  }
}

/**
 * Exchange a movie ID for a short-lived signed stream URL.
 * Only applicable when the movie's video is stored locally on the backend.
 * Returns null if the movie uses an external/CDN video provider.
 */
export async function fetchVideoStreamUrl(movieId: string): Promise<string | null> {
  try {
    const { data } = await apiClient.post(`/videos/token/${movieId}`);
    const streamPath: string = data.data.streamUrl;
    const backendBase = (import.meta.env.VITE_API_URL as string || "http://localhost:5000/api/v1")
      .replace(/\/api\/v1\/?$/, "");
    return `${backendBase}${streamPath}`;
  } catch {
    return null;
  }
}

export interface BackendPlan {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_cycle: "monthly" | "yearly";
  stripe_price_id: string | null;
  features_json: string[] | null;
  status: string;
}

export async function fetchPlans(): Promise<BackendPlan[]> {
  const { data } = await apiClient.get("/stripe/plans");
  return data.data.plans as BackendPlan[];
}
