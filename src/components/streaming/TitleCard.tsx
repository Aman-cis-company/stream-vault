import { Link } from "react-router-dom";
import type { Title } from "@/lib/mock-data";
import { Play, Plus, Star, Clock } from "lucide-react";
import { useState } from "react";

function posterBg(hue: number) {
  return {
    backgroundImage: `linear-gradient(150deg, oklch(0.42 0.18 ${hue}), oklch(0.20 0.08 ${(hue + 40) % 360}))`,
  };
}

export function TitleCard({ title, fullWidth: _fullWidth = false }: { title: Title; fullWidth?: boolean }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link to={`/watch/${title.id}`} className="group relative block w-full">
      {/* Card shell — overflow-hidden clips content, box-shadow is NOT clipped */}
      <div
        className={[
          "relative aspect-[2/3] overflow-hidden rounded-xl",
          "ring-1 ring-white/6",
          "shadow-[0_4px_16px_rgba(0,0,0,0.65)]",
          "transition-all duration-300 ease-out",
          "group-hover:scale-[1.04]",
          "group-hover:ring-primary/55",
          "group-hover:shadow-[0_20px_70px_rgba(0,0,0,0.95),0_0_0_1.5px_rgba(200,48,35,0.55),0_0_36px_rgba(200,48,35,0.22)]",
          "group-hover:z-10",
        ].join(" ")}
        style={posterBg(title.hue)}
      >
        {/* Poster image — always rendered; fallback is the posterBg gradient */}
        {!imgError && title.posterUrl && (
          <img
            src={title.posterUrl}
            alt={title.name}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {/* Base bottom gradient — always visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/12 to-transparent pointer-events-none" />

        {/* Hover gradient — richer overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/97 via-black/62 to-black/18 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* ── Badges ────────────────────────────────────────────────────────── */}
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

        {/* ── Centre play button — appears on hover ─────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div
            className="size-13 rounded-full bg-white/96 flex items-center justify-center
              shadow-[0_8px_30px_rgba(0,0,0,0.7)]
              scale-75 group-hover:scale-100 transition-transform duration-300 ease-out"
          >
            <Play className="size-6 fill-black text-black ml-0.5" />
          </div>
        </div>

        {/* ── Bottom info panel ─────────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 p-3 z-10">
          {/* Title — always visible */}
          <h3 className="line-clamp-2 text-[20px] font-bold leading-tight text-white drop-shadow-lg ">
            {title.name}
          </h3>

          {/* Meta row — slides in on hover */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-[60ms]">
            {title.rating > 0 && (
              <span className="inline-flex items-center gap-0.5 font-semibold text-amber-400">
                <Star className="size-3 fill-current" />
                {title.rating}
              </span>
            )}
            <span className="text-white/55">{title.year}</span>
            {title.durationMin > 0 && (
              <span className="inline-flex items-center gap-0.5 text-white/45">
                <Clock className="size-2.5 shrink-0" />
                {title.durationMin}m
              </span>
            )}
            <span className="rounded border border-white/22 px-1 text-[9px] text-white/50">
              {title.maturity}
            </span>
          </div>

          {/* Action buttons — slide up on hover */}
          <div className="mt-2 flex gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 delay-[90ms]">
            <button
              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-white text-black text-[11px] font-bold py-[6px]
                hover:bg-white/88 active:scale-95 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <Play className="size-[11px] fill-black shrink-0" />
              Watch Now
            </button>
            <button
              className="w-[30px] h-[30px] flex items-center justify-center rounded-lg border border-white/28 bg-black/55 text-white
                hover:bg-white/18 hover:border-white/45 active:scale-95 transition-all"
              onClick={(e) => e.stopPropagation()}
              aria-label="Add to list"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Watch progress bar */}
        {title.progress != null && (
          <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/10">
            <div className="h-full bg-primary" style={{ width: `${title.progress}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}
