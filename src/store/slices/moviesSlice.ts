import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/services/api";

export type ContentRating = "G" | "PG" | "PG-13" | "16+" | "18+" | "21+";
export type WarningFlag =
  | "violence"
  | "strong_language"
  | "mature_themes"
  | "nudity";

export interface BackendMovie {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  provider_name: "bunny" | "youtube" | "vimeo" | "external" | "local" | null;
  provider_video_id: string | null;
  duration: number | null;
  release_date: string | null;
  is_featured: boolean;
  status: "published" | "draft" | "archived";
  category_id: number | null;
  is_banner?: boolean;
  banner_order?: number;
  createdAt: string;
  updatedAt: string;
  category?: { id: number; name: string; slug: string } | null;
  language?: string | null;
  content_rating?: ContentRating | null;
  is_age_restricted?: boolean;
  minimum_age?: number | null;
  warning_flags_json?: WarningFlag[] | null;
  transcoding_status?: "pending" | "processing" | "completed" | "failed" | null;
  subtitle_url?: string | null;
  dubbed_audio_url?: string | null;
  rating?: number | null;
  progress?: number | null;
}

interface MoviesState {
  items: BackendMovie[];
  total: number;
  loading: boolean;
  error: string | null;
}

export const fetchMoviesThunk = createAsyncThunk(
  "movies/fetchAll",
  async (params?: {
    status?: string;
    search?: string;
    category_id?: number;
    limit?: number;
    page?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    if (params?.category_id) q.set("category_id", String(params.category_id));
    if (params?.limit) q.set("limit", String(params.limit));
    else q.set("limit", "100");
    if (params?.page) q.set("page", String(params.page));
    const { data } = await apiClient.get(`/movies?${q}`);
    return data;
  },
);

const initialState: MoviesState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

const moviesSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {
    upsertMovie: (state, { payload }: { payload: BackendMovie }) => {
      const idx = state.items.findIndex((m) => m.id === payload.id);
      if (idx >= 0) state.items[idx] = payload;
      else state.items.unshift(payload);
      state.total = state.items.length;
    },
    removeMovie: (state, { payload }: { payload: number }) => {
      state.items = state.items.filter((m) => m.id !== payload);
      state.total = state.items.length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMoviesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMoviesThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload.data?.movies ?? [];
        state.total = payload.meta?.total ?? state.items.length;
      })
      .addCase(fetchMoviesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch movies";
      });
  },
});

export const { upsertMovie, removeMovie } = moviesSlice.actions;
export default moviesSlice.reducer;
