import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/services/api";
import type { ContentRating, WarningFlag } from "@/lib/mock-data";

export interface BackendEpisode {
  id: number;
  series_id: number;
  season_number: number;
  episode_number: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  provider_name: "bunny" | "youtube" | "external" | "local" | null;
  provider_video_id: string | null;
  video_url: string | null;
  status: "published" | "draft" | "archived";
  release_date: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendSeries {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  language: string | null;
  content_rating: ContentRating | null;
  is_age_restricted: boolean;
  minimum_age: number | null;
  warning_flags_json: WarningFlag[] | null;
  is_featured: boolean;
  status: "published" | "draft" | "archived";
  total_seasons: number;
  release_date: string | null;
  category_id: number | null;
  createdAt: string;
  updatedAt: string;
  category?: { id: number; name: string; slug: string } | null;
  episodes?: BackendEpisode[];
}

interface SeriesState {
  items: BackendSeries[];
  total: number;
  loading: boolean;
  error: string | null;
}

export const fetchSeriesThunk = createAsyncThunk(
  "series/fetchAll",
  async (params?: { status?: string; search?: string; category_id?: number; limit?: number; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    if (params?.category_id) q.set("category_id", String(params.category_id));
    q.set("limit", String(params?.limit ?? 100));
    if (params?.page) q.set("page", String(params.page));
    const { data } = await apiClient.get(`/series?${q}`);
    return data;
  }
);

const initialState: SeriesState = { items: [], total: 0, loading: false, error: null };

const seriesSlice = createSlice({
  name: "series",
  initialState,
  reducers: {
    upsertSeries: (state, { payload }: { payload: BackendSeries }) => {
      const idx = state.items.findIndex((s) => s.id === payload.id);
      if (idx >= 0) state.items[idx] = payload;
      else state.items.unshift(payload);
      state.total = state.items.length;
    },
    removeSeries: (state, { payload }: { payload: number }) => {
      state.items = state.items.filter((s) => s.id !== payload);
      state.total = state.items.length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeriesThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSeriesThunk.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload.data?.series ?? [];
        state.total = payload.meta?.total ?? state.items.length;
      })
      .addCase(fetchSeriesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch series";
      });
  },
});

export const { upsertSeries, removeSeries } = seriesSlice.actions;
export default seriesSlice.reducer;
