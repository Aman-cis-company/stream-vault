import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Play, Plus } from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../ui/hover-card";

export interface HoverCardData {
  id: string;
  name: string;
  posterUrl: string;
  language?: string | null;
  year?: number | null;
  maturity?: string | null;
  durationMin?: number | null;
  seasonCount?: number | null;
  rating?: number | null;
  synopsis?: string | null;
  progress?: number | null;
  newRelease?: boolean;
  trending?: boolean;
  contentType: "movie" | "series";
}

interface TitleHoverCardProps {
  children: ReactNode;
  data: HoverCardData;
  sideOffset?: number;
}

export function TitleHoverCard({ children, data, sideOffset = -405 }: TitleHoverCardProps) {
  const watchUrl = data.contentType === "movie" ? `/watch/${data.id}` : `/series/${data.id}`;
  return (
    <HoverCard openDelay={350} closeDelay={150}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-[256px] p-0 border border-white/10 bg-zinc-950 text-white rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] pointer-events-auto"
        side="top"
        align="center"
        sideOffset={sideOffset}
      >
        {/* Expanded Image Header */}
        <div className="relative w-full aspect-square">
          <img 
            src={data.posterUrl} 
            alt={data.name} 
            className="w-full h-full object-cover" 
          />
          {/* Subtle bottom dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />
          
          {/* Overlaid Bold Title Name */}
          <div className="absolute inset-x-0 bottom-0 p-4 pt-10 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent">
            <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-md">
              {data.name}
            </h3>
          </div>

          {/* Language selector in top-left */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white/95 text-[10px] font-black px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
            {data.language || "Hindi"} <span className="text-[8px] text-white/60">▼</span>
          </div>

          {/* NEW Badge in top-right */}
          {data.newRelease && (
            <div className="absolute top-3 right-3 bg-primary text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-lg border border-white/10 animate-fade-in">
              NEW
            </div>
          )}
        </div>

        {/* Details Container */}
        <div className="p-4 flex flex-col gap-3">
          {/* Action Row */}
          <div className="flex gap-2">
            <Link 
              to={watchUrl}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-black py-2 px-4 shadow-[0_4px_12px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all"
            >
              <Play className="size-3.5 fill-black text-black ml-0.5" />
              Watch Now
            </Link>
            <button 
              className="size-8.5 flex items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white transition active:scale-[0.95] cursor-pointer"
              aria-label="Add to list"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-bold whitespace-nowrap overflow-hidden w-full">
            <span className="pe-1">{data.year}</span>
            {/* <span className="text-zinc-500">•</span> */}
            <span className="rounded border border-zinc-700 bg-zinc-900 px-1 py-[0.5px] text-[9px] text-zinc-300 font-black pe-1">
              {data.maturity || "PG-13"}
            </span>
            {/* <span className="text-zinc-500">•</span> */}
            {data.contentType === "movie" ? (
              data.durationMin && data.durationMin > 0 ? (
                <span className="pe-1">{data.durationMin}m</span>
              ) : (
                <span className="pe-1">90m</span>
              )
            ) : (
              <span className="pe-1">{data.seasonCount || 1} Season{(data.seasonCount || 1) !== 1 ? "s" : ""}</span>
            )}
            {/* <span className="text-zinc-500">•</span> */}
            <span className="text-zinc-400 pe-1">{data.language || "Hindi"}</span>
            {/* <span className="text-zinc-500">•</span> */}
            <span className="text-zinc-400 pe-1">{data?.rating}</span>
            {(() => {
              const ratingVal = typeof data.rating === "number"
                ? data.rating
                : data.rating
                  ? Number(data.rating)
                  : 0;
              return ratingVal > 0 ? (
                <>
                  {/* <span className="text-zinc-500">•</span> */}
                  <span className="inline-flex items-center gap-0.5 text-amber-400 font-black pe-1">
                    ★{ratingVal.toFixed(1)}
                  </span>
                </>
              ) : null;
            })()}
          </div>

          {/* Truncated Description */}
          {data.synopsis && (
            <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
              {data.synopsis}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
