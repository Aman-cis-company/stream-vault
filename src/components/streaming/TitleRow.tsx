import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Play, Tv2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import type { Title } from "@/lib/mock-data";
import { TitleCard } from "./TitleCard";
import type { BackendSeries } from "@/lib/series";
import { seriesThumbnail } from "@/lib/series";
import { TitleHoverCard } from "./TitleHoverCard";

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="shrink-0 rounded-xl overflow-hidden"
      style={{ width: "clamp(155px, 13vw, 205px)", aspectRatio: "2/3" }}
    >
      <div className="size-full bg-white/5 animate-pulse" />
    </div>
  );
}

// ── Series card ───────────────────────────────────────────────────────────────

export function SeriesCard({ s }: { s: BackendSeries }) {
  const [imgErr, setImgErr] = useState(false);

  const optimizedThumbnail = seriesThumbnail(s).startsWith("https://image.tmdb.org/")
    ? seriesThumbnail(s).replace("/t/p/original/", "/t/p/w500/")
    : seriesThumbnail(s);

  const seriesHue = Array.from(s.title).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  const ratingVal = s.rating ? Number(s.rating) : (7.4 + (seriesHue % 18) / 10);

  const hoverData = {
    id: String(s.id),
    name: s.title,
    posterUrl: imgErr ? `https://picsum.photos/seed/s${s.id}/342/513` : optimizedThumbnail,
    language: s.language,
    year: s.release_date ? new Date(s.release_date).getFullYear() : 2025,
    maturity: s.content_rating,
    seasonCount: s.total_seasons,
    synopsis: s.description,
    progress: s.progress,
    newRelease: false,
    trending: s.is_featured,
    rating: ratingVal,
    contentType: "series" as const,
  };

  return (
    <TitleHoverCard data={hoverData} sideOffset={-350}>
      <Link
        to={`/series/${s.id}`}
        className={[
          "group relative block w-full aspect-[2/3] overflow-hidden rounded-xl",
          "ring-1 ring-white/6 shadow-[0_4px_16px_rgba(0,0,0,0.65)]",
          "transition-all duration-300 ease-out",
        ].join(" ")}
      >
        {/* Poster */}
        <img
          src={imgErr ? `https://picsum.photos/seed/s${s.id}/342/513` : optimizedThumbnail}
          alt={s.title}
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
          onError={() => setImgErr(true)}
        />

        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          <span className="inline-flex items-center gap-[3px] rounded-md bg-sky-500/25 backdrop-blur-sm border border-sky-400/30 px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-wide text-sky-300">
            <Tv2 className="size-2.5 shrink-0" /> Series
          </span>
          {s.is_featured && (
            <span className="rounded-md bg-amber-500/85 px-1.5 py-[3px] text-[9px] font-bold uppercase text-black">
              Featured
            </span>
          )}
        </div>

        {/* Bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-3 z-10">
          <p className="text-[20px] font-bold text-white drop-shadow-lg leading-tight line-clamp-2">
            {s.title}
          </p>
        </div>

        {/* Watch progress bar */}
        {s.progress != null && (
          <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/10">
            <div className="h-full bg-primary" style={{ width: `${s.progress}%` }} />
          </div>
        )}
      </Link>
    </TitleHoverCard>
  );
}

// ── Badge config ──────────────────────────────────────────────────────────────

const BADGE_CONFIG = {
  trending: { label: "Trending",  classes: "bg-orange-500/18 text-orange-300 border-orange-500/28", emoji: "🔥" },
  new:      { label: "New",       classes: "bg-primary/18 text-primary border-primary/28",           emoji: "✨" },
  series:   { label: "Series",    classes: "bg-sky-500/18 text-sky-300 border-sky-500/28",            emoji: "📺" },
  featured: { label: "Featured",  classes: "bg-amber-500/18 text-amber-300 border-amber-500/28",      emoji: "⭐" },
} as const;

// ── Base Embla row (internal) ─────────────────────────────────────────────────

interface EmblaRowProps {
  heading: string;
  badge?: keyof typeof BADGE_CONFIG;
  seeAllHref?: string;
  loading?: boolean;
  skeletonCount?: number;
  children?: ReactNode;
}

export function EmblaRow({
  heading,
  badge,
  seeAllHref,
  loading,
  skeletonCount = 7,
  children,
}: EmblaRowProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
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

  const badgeCfg = badge ? BADGE_CONFIG[badge] : null;

  return (
    <section className="group/row relative w-full">
      {/* ── Section header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 mb-3 sm:px-10 lg:px-14">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Vertical accent bar */}
          <div className="shrink-0 w-[3px] h-6 sm:h-7 rounded-full bg-primary shadow-[0_0_12px_theme(colors.primary/55%)]" />
          <h2 className="text-[1.15rem] font-extrabold tracking-tight text-foreground sm:text-[1.35rem] truncate">
            {heading}
          </h2>
          {badgeCfg && (
            <span
              className={[
                "hidden sm:inline-flex shrink-0 items-center gap-1",
                "rounded-full border px-2.5 py-[3px]",
                "text-[10px] font-bold uppercase tracking-wider",
                badgeCfg.classes,
              ].join(" ")}
            >
              <span aria-hidden>{badgeCfg.emoji}</span>
              {badgeCfg.label}
            </span>
          )}
        </div>
        {seeAllHref && (
          <Link
            to={seeAllHref}
            className="ml-4 shrink-0 flex items-center gap-0.5 text-[0.8rem] font-semibold text-primary/65 hover:text-primary transition-colors"
          >
            See all
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>

      {/* ── Carousel ────────────────────────────────────────────────────────── */}
      <div className="relative">

        {/* Left gradient + arrow */}
        <div
          className={[
            "absolute inset-y-0 left-0 z-20 flex items-center",
            "bg-gradient-to-r from-background via-background/75 to-transparent",
            "w-20 transition-opacity duration-300",
            canScrollPrev
              ? "opacity-0 group-hover/row:opacity-100"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <button
            onClick={scrollPrev}
            className="ml-3 size-10 rounded-full
              bg-card/90 border border-border backdrop-blur-sm
              flex items-center justify-center text-foreground
              hover:bg-muted hover:scale-110
              dark:bg-black/75 dark:border-white/14 dark:text-white
              dark:hover:bg-white/20 dark:hover:border-white/32
              active:scale-95 transition-all duration-200 shadow-xl cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>

        {/* Embla viewport — py-4 gives shadow/scale breathing room */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-3 pl-4 sm:pl-10 lg:pl-14 py-4 touch-pan-y select-none">
            {loading
              ? Array.from({ length: skeletonCount }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : children}
            {/* Right edge spacer so last card doesn't touch screen edge */}
            <div className="shrink-0 w-4 sm:w-10 lg:w-14 flex-none" aria-hidden />
          </div>
        </div>

        {/* Right gradient + arrow */}
        <div
          className={[
            "absolute inset-y-0 right-0 z-20 flex items-center justify-end",
            "bg-gradient-to-l from-background via-background/75 to-transparent",
            "w-20 transition-opacity duration-300",
            canScrollNext
              ? "opacity-0 group-hover/row:opacity-100"
              : "opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <button
            onClick={scrollNext}
            className="mr-3 size-10 rounded-full
              bg-card/90 border border-border backdrop-blur-sm
              flex items-center justify-center text-foreground
              hover:bg-muted hover:scale-110
              dark:bg-black/75 dark:border-white/14 dark:text-white
              dark:hover:bg-white/20 dark:hover:border-white/32
              active:scale-95 transition-all duration-200 shadow-xl cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Public: movie row ─────────────────────────────────────────────────────────

const CARD_W = "clamp(155px, 13vw, 205px)";

export function ContentRow({
  heading,
  titles,
  badge,
  seeAllHref,
  loading,
}: {
  heading: string;
  titles: Title[];
  badge?: keyof typeof BADGE_CONFIG;
  seeAllHref?: string;
  loading?: boolean;
}) {
  if (!loading && !titles.length) return null;
  return (
    <EmblaRow heading={heading} badge={badge} seeAllHref={seeAllHref} loading={loading}>
      {titles.map((t) => (
        <div key={t.id} className="shrink-0" style={{ width: CARD_W }}>
          <TitleCard title={t} />
        </div>
      ))}
    </EmblaRow>
  );
}

// ── Public: series row ────────────────────────────────────────────────────────

export function SeriesContentRow({
  heading,
  series,
  badge,
  seeAllHref,
  loading,
}: {
  heading: string;
  series: BackendSeries[];
  badge?: keyof typeof BADGE_CONFIG;
  seeAllHref?: string;
  loading?: boolean;
}) {
  if (!loading && !series.length) return null;
  return (
    <EmblaRow heading={heading} badge={badge} seeAllHref={seeAllHref} loading={loading}>
      {series.map((s) => (
        <div key={s.id} className="shrink-0" style={{ width: CARD_W }}>
          <SeriesCard s={s} />
        </div>
      ))}
    </EmblaRow>
  );
}

// ── Backward-compat alias (used by src/routes/index.tsx) ─────────────────────

export function TitleRow({ heading, titles }: { heading?: string; titles: Title[] }) {
  if (!titles?.length) return null;
  return <ContentRow heading={heading ?? ""} titles={titles} />;
}
