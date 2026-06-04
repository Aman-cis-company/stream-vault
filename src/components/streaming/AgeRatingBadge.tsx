import type { ContentRating } from "@/lib/mock-data";

const RATING_STYLES: Record<ContentRating, string> = {
  "G":     "bg-green-500/20 text-green-400 border-green-500/40",
  "PG":    "bg-blue-500/20 text-blue-400 border-blue-500/40",
  "PG-13": "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  "16+":   "bg-orange-500/20 text-orange-400 border-orange-500/40",
  "18+":   "bg-red-500/20 text-red-400 border-red-500/40",
  "21+":   "bg-purple-500/20 text-purple-400 border-purple-500/40",
};

interface Props {
  rating: ContentRating | null | undefined;
  className?: string;
}

export function AgeRatingBadge({ rating, className = "" }: Props) {
  if (!rating) return null;
  const style = RATING_STYLES[rating] ?? "bg-white/10 text-white/60 border-white/20";
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${style} ${className}`}
    >
      {rating}
    </span>
  );
}
