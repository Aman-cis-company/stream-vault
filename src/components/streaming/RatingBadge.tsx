import { Star } from "lucide-react";

interface Props {
  rating: number | string | null | undefined;
  className?: string;
  showMax?: boolean;
}

export function RatingBadge({ rating, className = "", showMax = true }: Props) {
  if (rating === null || rating === undefined || rating === 0 || rating === "" || rating === "0" || rating === "0.0") return null;
  const numericRating = Number(rating);
  if (isNaN(numericRating)) return null;

  const formatted = numericRating.toFixed(1);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded bg-black/50 backdrop-blur-sm border border-amber-500/35 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.15)] tracking-wide shrink-0 select-none ${className}`}
    >
      <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />
      <span>{formatted}{showMax ? "/10" : ""}</span>
      <span className="text-[8px] opacity-70 font-semibold tracking-normal ml-0.5">IMDb</span>
    </span>
  );
}
