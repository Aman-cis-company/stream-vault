import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/services/api";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  is_age_restricted?: boolean;
  minimum_age?: number | null;
}

interface CategoriesState {
  items: Category[];
  total: number;
  loading: boolean;
  error: string | null;
}

export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async (params?: { status?: string; search?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    if (params?.limit) q.set("limit", String(params.limit));
    else q.set("limit", "100");
    const { data } = await apiClient.get(`/categories?${q}`);
    return data;
  }
);

const initialState: CategoriesState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    upsertCategory: (state, { payload }: { payload: Category }) => {
      const idx = state.items.findIndex((c) => c.id === payload.id);
      if (idx >= 0) state.items[idx] = payload;
      else state.items.unshift(payload);
      state.total = state.items.length;
    },
    removeCategory: (state, { payload }: { payload: number }) => {
      state.items = state.items.filter((c) => c.id !== payload);
      state.total = state.items.length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload.data?.categories ?? [];
        state.total = payload.meta?.total ?? state.items.length;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch categories";
      });
  },
});

export const { upsertCategory, removeCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;
