import { Link } from "react-router-dom";
import type { Title } from "@/lib/mock-data";
import { useState } from "react";
import { TitleHoverCard } from "./TitleHoverCard";

function posterBg(hue: number) {
  return {
    backgroundImage: `linear-gradient(150deg, oklch(0.42 0.18 ${hue}), oklch(0.20 0.08 ${(hue + 40) % 360}))`,
  };
}

export function TitleCard({ title, fullWidth: _fullWidth = false }: { title: Title; fullWidth?: boolean }) {
  const [imgError, setImgError] = useState(false);

  const optimizedPoster = title.posterUrl?.startsWith("https://image.tmdb.org/")
    ? title.posterUrl.replace("/t/p/original/", "/t/p/w500/")
    : title.posterUrl;

  const hoverData = {
    id: title.id,
    name: title.name,
    posterUrl: optimizedPoster,
    language: title.language,
    year: title.year,
    maturity: title.maturity,
    durationMin: title.durationMin,
    rating: title.rating,
    synopsis: title.synopsis,
    progress: title.progress,
    newRelease: title.newRelease,
    trending: title.trending,
    contentType: "movie" as const,
  };

  return (
    <TitleHoverCard data={hoverData} sideOffset={-350}>
      <Link to={`/watch/${title.id}`} className="group relative block w-full">
        {/* Card shell — with transition scale and shadow */}
        <div
          className={[
            "relative aspect-[2/3] overflow-hidden rounded-xl",
            "ring-1 ring-white/6",
            "shadow-[0_4px_16px_rgba(0,0,0,0.65)]",
            "transition-all duration-300 ease-out",
          ].join(" ")}
          style={posterBg(title.hue)}
        >
          {/* Poster image */}
          {!imgError && title.posterUrl && (
            <img
              src={optimizedPoster}
              alt={title.name}
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}

          {/* Base bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {title.newRelease && (
              <span className="rounded-md bg-primary px-1.5 py-[3px] text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                New
              </span>
            )}
            {title.trending && !title.newRelease && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/90 px-1.5 py-[3px] text-[10px] font-bold uppercase tracking-wide text-black shadow-lg">
                🔥 Hot
              </span>
            )}
          </div>

          {/* Bottom info panel */}
          <div className="absolute inset-x-0 bottom-0 p-3 z-10">
            <h3 className="line-clamp-2 text-[20px] font-bold leading-tight text-white drop-shadow-lg">
              {title.name}
            </h3>
          </div>

          {/* Watch progress bar */}
          {title.progress != null && (
            <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/10">
              <div className="h-full bg-primary" style={{ width: `${title.progress}%` }} />
            </div>
          )}
        </div>
      </Link>
    </TitleHoverCard>
  );
}
