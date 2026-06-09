import { Link } from "react-router-dom";
import type { Title } from "@/lib/mock-data";
import { Play, Plus, Star, Clock } from "lucide-react";
import { useState } from "react";

function posterBg(hue: number) {
  return {
    backgroundImage: `linear-gradient(150deg, oklch(0.42 0.18 ${hue}), oklch(0.20 0.08 ${(hue + 40) % 360}))`,
  };
}

export function TitleCard({ title, fullWidth = false }: { title: Title; fullWidth?: boolean }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to={`/watch/${title.id}`}
      className={`group relative block ${fullWidth ? "w-full" : "w-40 shrink-0 sm:w-48"}`}
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-card ring-1 ring-border/50 transition-all duration-300 group-hover:scale-[1.06] group-hover:ring-primary/60 group-hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.85)]"
        style={posterBg(title.hue)}
      >
        {!imgError && (
          <img
            src={title.posterUrl}
            alt={title.name}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {/* Gradient overlay — stronger on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent transition-opacity duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        {title.newRelease && (
          <span className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-lg">
            New
          </span>
        )}
        {title.trending && !title.newRelease && (
          <span className="absolute left-2 top-2 rounded-md bg-warning/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-foreground shadow-lg">
            Hot
          </span>
        )}

        {/* Bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white drop-shadow-md">
            {title.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/75">
            <span className="inline-flex items-center gap-0.5 font-medium text-warning">
              <Star className="size-3 fill-current" />{title.rating}
            </span>
            <span>{title.year}</span>
            <span className="rounded border border-white/20 px-1 text-[10px]">{title.maturity}</span>
          </div>
          {title.durationMin > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Clock className="size-3" /> {title.durationMin}m
            </div>
          )}
        </div>

        {/* Hover action overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 backdrop-blur-[3px] transition-all duration-300 group-hover:opacity-100">
          <span className="inline-flex size-13 items-center justify-center rounded-full bg-white text-black shadow-xl transition-transform duration-200 hover:scale-110">
            <Play className="size-5 fill-black ml-0.5" />
          </span>
          <span className="inline-flex size-10 items-center justify-center rounded-full border-2 border-white/50 bg-black/30 text-white backdrop-blur-sm transition-transform duration-200 hover:scale-110 hover:border-white">
            <Plus className="size-4" />
          </span>
        </div>
      </div>

      {title.progress != null && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${title.progress}%` }}
          />
        </div>
      )}
    </Link>
  );
}
