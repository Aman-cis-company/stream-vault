import { apiClient, assetUrl } from "@/services/api";
import type { BackendSeries, BackendEpisode } from "@/store/slices/seriesSlice";

export type { BackendSeries, BackendEpisode };

export async function fetchSeriesList(params?: { status?: string; limit?: number; categoryId?: number }): Promise<BackendSeries[]> {
  const q = new URLSearchParams();
  q.set("status", params?.status ?? "published");
  q.set("limit", String(params?.limit ?? 100));
  if (params?.categoryId) q.set("category_id", String(params.categoryId));
  const { data } = await apiClient.get(`/series?${q}`);
  return data.data.series as BackendSeries[];
}

export async function fetchSeriesById(id: string | number): Promise<BackendSeries | null> {
  try {
    const { data } = await apiClient.get(`/series/${id}`);
    return data.data.series as BackendSeries;
  } catch {
    return null;
  }
}

export async function fetchEpisodesBySeriesId(seriesId: string | number): Promise<BackendEpisode[]> {
  try {
    const { data } = await apiClient.get(`/series/${seriesId}/episodes`);
    return data.data.episodes as BackendEpisode[];
  } catch {
    return [];
  }
}

export async function fetchEpisodeById(seriesId: string | number, episodeId: string | number): Promise<BackendEpisode | null> {
  try {
    const { data } = await apiClient.get(`/series/${seriesId}/episodes/${episodeId}`);
    return data.data.episode as BackendEpisode;
  } catch {
    return null;
  }
}

export function seriesThumbnail(s: BackendSeries): string {
  if (s.thumbnail_url) return assetUrl(s.thumbnail_url);
  return `https://picsum.photos/seed/series-${s.id}/342/513`;
}

export function episodeThumbnail(ep: BackendEpisode): string {
  if (ep.thumbnail_url) return assetUrl(ep.thumbnail_url);
  return `https://picsum.photos/seed/ep-${ep.id}/640/360`;
}

export function episodeVideoUrl(ep: BackendEpisode): string {
  return ep.video_url ? assetUrl(ep.video_url) : "";
}

export function groupEpisodesBySeasons(episodes: BackendEpisode[]): Record<number, BackendEpisode[]> {
  return episodes.reduce<Record<number, BackendEpisode[]>>((acc, ep) => {
    if (!acc[ep.season_number]) acc[ep.season_number] = [];
    acc[ep.season_number].push(ep);
    return acc;
  }, {});
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
