import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Title } from "@/lib/mock-data";

// ── Number Component ──────────────────────────────────────────────────────────
// Large metallic outlined rank numbers like JioHotstar / Netflix Top-10 rows

function RankNumber({ rank }: { rank: number }) {
  const text = String(rank);
  const isWide = rank === 10;

  return (
    <div
      className="absolute -left-3 bottom-0 pointer-events-none select-none z-[1]"
      style={{ height: "68%" }}
    >
      <svg
        viewBox={isWide ? "0 0 110 140" : "0 0 80 140"}
        className="h-full"
        style={{ filter: "drop-shadow(2px 5px 10px rgba(0,0,0,0.85))" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={`num-stroke-${rank}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id={`num-fill-${rank}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#08080c" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#030304" stopOpacity="0.96" />
          </linearGradient>
        </defs>
        {/* Outer stroke outline */}
        <text
          x="50%"
          y="83%"
          textAnchor="middle"
          dominantBaseline="auto"
          fill="none"
          stroke={`url(#num-stroke-${rank})`}
          strokeWidth="6"
          fontSize="152"
          fontWeight="950"
          fontFamily="'Outfit', 'Inter', system-ui, sans-serif"
          letterSpacing="-0.08em"
          paintOrder="stroke fill"
        >
          {text}
        </text>
        {/* Inner dark fill */}
        <text
          x="50%"
          y="83%"
          textAnchor="middle"
          dominantBaseline="auto"
          fill={`url(#num-fill-${rank})`}
          fontSize="152"
          fontWeight="950"
          fontFamily="'Outfit', 'Inter', system-ui, sans-serif"
          letterSpacing="-0.08em"
        >
          {text}
        </text>
      </svg>
    </div>
  );
}

// ── Top 10 Card ───────────────────────────────────────────────────────────────

function Top10Card({ title, rank }: { title: Title; rank: number }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      className="relative flex flex-col shrink-0 select-none"
      style={{ width: "200px" }}
    >
      <div
        className="relative flex items-end justify-end w-full"
        style={{ height: "220px" }}
      >
        {/* Large Rank Number ── positioned behind poster edge */}
        <RankNumber rank={rank} />

        {/* Poster Card */}
        <Link
          to={title.id ? `/watch/${title.id}` : "#"}
          className={[
            "relative block overflow-hidden rounded-xl ml-auto z-10",
            "ring-1 ring-white/10",
            "shadow-[0_8px_32px_rgba(0,0,0,0.75)]",
            "transition-all duration-400 ease-out",
            "hover:scale-[1.06]",
            "hover:ring-primary/60",
            "hover:shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_2px_rgba(200,48,35,0.55),0_0_30px_rgba(200,48,35,0.2)]",
            "hover:z-20 group",
          ].join(" ")}
          style={{ width: "145px", height: "215px" }}
        >
          {/* Poster Image */}
          <img
            src={
              imgErr
                ? `https://picsum.photos/seed/top10-${rank}/300/450`
                : title.posterUrl
            }
            alt={title.name}
            className="absolute inset-0 size-full object-cover transition-transform duration-600 ease-out group-hover:scale-[1.1]"
            loading="lazy"
            onError={() => setImgErr(true)}
          />

          {/* Hover highlight overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Top badges */}
          <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between">
            {/* Rank badge */}
            <span className="inline-flex items-center gap-[3px] rounded-md bg-gradient-to-r from-red-600 to-red-700 backdrop-blur-sm px-1.5 py-[3px] text-[9px] font-black uppercase tracking-wide text-white shadow-[0_2px_8px_rgba(220,38,38,0.5)]">
              #{rank}
            </span>
            {/* Rating */}
            {title.rating > 0 && (
              <span className="inline-flex items-center gap-[2px] rounded-md bg-black/60 backdrop-blur-sm border border-white/10 px-1.5 py-[3px] text-[9px] font-bold text-amber-400">
                <Star className="size-[8px] fill-amber-400 text-amber-400" />
                {title.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Centre play on hover */}
          <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <div className="size-11 rounded-full bg-white/95 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.7)] scale-75 group-hover:scale-100 transition-transform duration-300 ease-out">
              <Play className="size-4.5 fill-black text-black ml-0.5" />
            </div>
          </div>
        </Link>
      </div>

      {/* Title + Subtitle centered below the poster card */}
      <div className="mt-3.5 text-center w-[145px] ml-auto">
        <p className="text-[14px] font-extrabold text-white leading-tight truncate hover:text-primary transition-colors">
          <Link to={title.id ? `/watch/${title.id}` : "#"}>
            {title.name}
          </Link>
        </p>
        <p className="mt-1 text-[11px] text-zinc-400 font-semibold tracking-wide">
          {title.year} • {title.language}
        </p>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Top10Skeleton({ index }: { index: number }) {
  return (
    <div className="shrink-0 flex flex-col items-center relative" style={{ width: "200px" }}>
      <div className="relative flex items-end justify-end w-full" style={{ height: "220px" }}>
        {/* Skeleton number */}
        <div
          className="absolute -left-2 bottom-2 w-12 h-24 rounded-lg bg-white/[0.03] animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        />
        {/* Skeleton card */}
        <div
          className="ml-auto rounded-xl bg-white/5 animate-pulse"
          style={{ width: "145px", height: "215px", animationDelay: `${index * 100 + 50}ms` }}
        />
      </div>
      {/* Skeleton text */}
      <div className="mt-3.5 w-[145px] ml-auto space-y-2">
        <div className="h-3.5 bg-white/5 rounded animate-pulse" style={{ animationDelay: `${index * 100 + 100}ms` }} />
        <div className="h-2.5 w-2/3 bg-white/5 rounded animate-pulse mx-auto" style={{ animationDelay: `${index * 100 + 150}ms` }} />
      </div>
    </div>
  );
}

// ── Top 10 Row ────────────────────────────────────────────────────────────────

interface Top10RowProps {
  heading: string;
  titles: Title[];
  loading?: boolean;
}

export function Top10Row({ heading, titles, loading }: Top10RowProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onScroll);
    emblaApi.on("reInit", onScroll);
    onScroll();
    return () => {
      emblaApi.off("select", onScroll);
      emblaApi.off("reInit", onScroll);
    };
  }, [emblaApi, onScroll]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const displayTitles = titles.slice(0, 10);
  if (!loading && !displayTitles.length) return null;

  return (
    <section className="group/row relative w-full py-2">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 mb-4 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3 min-w-0">
          {/* Glowing accent bar */}
          <div className="shrink-0 w-[3px] h-7 sm:h-8 rounded-full bg-gradient-to-b from-red-500 to-red-700 shadow-[0_0_16px_rgba(220,38,38,0.55)]" />

          <h2 className="text-[1.2rem] font-extrabold tracking-tight text-white sm:text-[1.45rem] truncate">
            {heading}
          </h2>

          {/* Premium "TOP 10" Badge styled like metallic red badge with white letters */}
          <span className="hidden sm:inline-flex shrink-0 items-center justify-center rounded-lg border border-red-500/50 bg-gradient-to-b from-red-600 to-red-800 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-[0_4px_14px_rgba(220,38,38,0.4)]">
            TOP 10
          </span>
        </div>
      </div>

      {/* ── Carousel ────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Left gradient + arrow */}
        <div
          className={[
            "absolute inset-y-0 left-0 z-20 flex items-center",
            "bg-gradient-to-r from-background via-background/80 to-transparent",
            "w-20 transition-opacity duration-300",
            canScrollPrev
              ? "opacity-0 group-hover/row:opacity-100"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <button
            onClick={scrollPrev}
            className="ml-3 size-10 rounded-full bg-black/80 border border-white/12 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 hover:border-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>

        {/* Embla viewport */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-2 pl-4 sm:pl-10 lg:pl-14 py-4 touch-pan-y select-none">
            {loading
              ? Array.from({ length: 7 }).map((_, i) => <Top10Skeleton key={i} index={i} />)
              : displayTitles.map((t, i) => (
                  <Top10Card key={t.id} title={t} rank={i + 1} />
                ))}
            {/* Right edge spacer */}
            <div className="shrink-0 w-4 sm:w-10 lg:w-14 flex-none" aria-hidden />
          </div>
        </div>

        {/* Right gradient + arrow */}
        <div
          className={[
            "absolute inset-y-0 right-0 z-20 flex items-center justify-end",
            "bg-gradient-to-l from-background via-background/80 to-transparent",
            "w-20 transition-opacity duration-300",
            canScrollNext
              ? "opacity-0 group-hover/row:opacity-100"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <button
            onClick={scrollNext}
            className="mr-3 size-10 rounded-full bg-black/80 border border-white/12 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 hover:border-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {/* Carousel Dot Indicators at the bottom */}
      {!loading && scrollSnaps.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? "w-5 h-2 bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                  : "size-2 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
