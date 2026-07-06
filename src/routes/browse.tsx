import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Hero } from "@/components/streaming/Hero";
import { ContentRow, SeriesContentRow, SeriesCard, EmblaRow } from "@/components/streaming/TitleRow";
import { TitleCard } from "@/components/streaming/TitleCard";
import { Top10Row } from "@/components/streaming/Top10Row";
import { apiClient } from "@/services/api";
import { mapMovieToTitle } from "@/lib/movies";
import { fetchSeriesList } from "@/lib/series";
import { DUMMY_MOVIES, DUMMY_SERIES, TOP_10_INDIA_HINDI } from "@/lib/mock-data";
import type { Title } from "@/lib/mock-data";
import type { BackendMovie } from "@/store/slices/moviesSlice";
import type { BackendSeries } from "@/lib/series";
import type { Category } from "@/store/slices/categoriesSlice";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";
import { Loader2, ChevronRight } from "lucide-react";

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-28 text-center mx-4 sm:mx-10 lg:mx-14">
      <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Loader2 className="size-7 text-muted-foreground/50" />
      </div>
      <p className="text-lg font-semibold text-foreground/80">No content available yet</p>
      <p className="mt-1 text-sm text-muted-foreground">Check back soon — new titles are being added.</p>
    </div>
  );
}

// ── Skeleton rows (while loading) ─────────────────────────────────────────────

function SkeletonRows() {
  const LABELS = ["Trending Now", "Web Series", "Action", "Drama", "Comedy"];
  return (
    <div className="space-y-2 pt-6">
      {LABELS.map((label) => (
        <ContentRow key={label} heading={label} titles={[]} loading />
      ))}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="relative mx-4 sm:mx-10 lg:mx-14 my-1">
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

// ── Custom grid row (for full width languages/genres/channels) ────────────────

interface CustomGridRowProps {
  heading: string;
  seeAllHref?: string;
  children: React.ReactNode;
  gridColsClass: string;
}

function CustomGridRow({ heading, seeAllHref, children, gridColsClass }: CustomGridRowProps) {
  return (
    <section className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3 sm:px-10 lg:px-14">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 w-[3px] h-6 sm:h-7 rounded-full bg-primary shadow-[0_0_12px_theme(colors.primary/55%)]" />
          <h2 className="text-[1.15rem] font-extrabold tracking-tight text-foreground sm:text-[1.35rem] truncate">
            {heading}
          </h2>
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

      {/* Grid container */}
      <div className="px-4 sm:px-10 lg:px-14 py-2">
        <div className={`grid gap-4 ${gridColsClass}`}>
          {children}
        </div>
      </div>
    </section>
  );
}

// ── Browse page constants ──────────────────────────────────────────────────────

const POPULAR_LANGUAGES = [
  {
    id: "Hindi",
    name: "Hindi",
    native: "हिंदी",
    bgGradient: "from-blue-950 via-blue-900/60 to-transparent",
    bgColor: "bg-blue-950/80",
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "English",
    name: "English",
    native: "English",
    bgGradient: "from-amber-950 via-amber-900/60 to-transparent",
    bgColor: "bg-amber-950/80",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "Tamil",
    name: "Tamil",
    native: "தமிழ்",
    bgGradient: "from-orange-950 via-orange-900/60 to-transparent",
    bgColor: "bg-orange-950/80",
    image: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "Telugu",
    name: "Telugu",
    native: "తెలుగు",
    bgGradient: "from-slate-900 via-slate-800/60 to-transparent",
    bgColor: "bg-slate-900/80",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "Kannada",
    name: "Kannada",
    native: "ಕನ್ನಡ",
    bgGradient: "from-red-950 via-red-900/60 to-transparent",
    bgColor: "bg-red-950/80",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: "Malayalam",
    name: "Malayalam",
    native: "മലയാളം",
    bgGradient: "from-purple-950 via-purple-900/60 to-transparent",
    bgColor: "bg-purple-950/80",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&auto=format&fit=crop",
  },
];

const POPULAR_GENRES = [
  {
    id: "Romance",
    name: "Romance",
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=300&auto=format&fit=crop",
    bgGradient: "from-rose-950/90 via-rose-900/40 to-transparent",
    bgColor: "bg-rose-950/60",
  },
  {
    id: "Drama",
    name: "Drama",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=300&auto=format&fit=crop",
    bgGradient: "from-teal-950/90 via-teal-900/40 to-transparent",
    bgColor: "bg-teal-950/60",
  },
  {
    id: "Family",
    name: "Family",
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=300&auto=format&fit=crop",
    bgGradient: "from-yellow-950/90 via-yellow-900/40 to-transparent",
    bgColor: "bg-yellow-950/60",
  },
  {
    id: "Reality",
    name: "Reality",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
    bgGradient: "from-blue-950/90 via-blue-900/40 to-transparent",
    bgColor: "bg-blue-950/60",
  },
  {
    id: "Comedy",
    name: "Comedy",
    image: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?q=80&w=300&auto=format&fit=crop",
    bgGradient: "from-cyan-950/90 via-cyan-900/40 to-transparent",
    bgColor: "bg-cyan-950/60",
  },
  {
    id: "Mystery",
    name: "Mystery",
    image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=300&auto=format&fit=crop",
    bgGradient: "from-violet-950/90 via-violet-900/40 to-transparent",
    bgColor: "bg-violet-950/60",
  },
];

const POPULAR_CHANNELS = [
  {
    id: "StarPlus",
    name: "StarPlus",
    renderLogo: () => (
      <svg viewBox="0 0 100 80" className="h-20 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 8 L58 28 L80 28 L62 38 L68 58 L50 46 L32 58 L38 38 L20 28 L42 28 Z" fill="#FF1E27" filter="drop-shadow(0px 0px 4px rgba(255, 30, 39, 0.6))" />
        <path d="M50 46 C45 42, 30 55, 20 60 C32 54, 45 48, 50 46 Z" fill="#FFC700" />
        <path d="M50 46 C55 42, 70 55, 80 60 C68 54, 55 48, 50 46 Z" fill="#FFC700" />
        <text x="50" y="68" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="7.5" textAnchor="middle" letterSpacing="0.5">StarPlus</text>
        <text x="50" y="75" fill="#FFC700" fontFamily="sans-serif" fontWeight="500" fontSize="3.8" textAnchor="middle">रिश्ता वही, बात नई</text>
      </svg>
    ),
  },
  {
    id: "Colors",
    name: "Colors",
    renderLogo: () => (
      <svg viewBox="0 0 120 80" className="h-20 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="45" y="48" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="800" fontSize="20" textAnchor="middle">colors</text>
        <path d="M82 25 C82 25, 92 10, 105 18 C112 24, 105 38, 92 35 C82 32, 82 25, 82 25 Z" fill="url(#colorsGrad)" />
        <defs>
          <linearGradient id="colorsGrad" x1="82" y1="10" x2="105" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF5E00" />
            <stop offset="35%" stopColor="#FF007A" />
            <stop offset="70%" stopColor="#7000FF" />
            <stop offset="100%" stopColor="#00A2FF" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: "Vijay",
    name: "Vijay",
    renderLogo: () => (
      <svg viewBox="0 0 100 80" className="h-20 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10 L58 30 L80 30 L62 40 L68 60 L50 48 L32 60 L38 40 L20 30 L42 30 Z" fill="#FFC700" filter="drop-shadow(0px 0px 4px rgba(255, 199, 0, 0.4))" />
        <text x="50" y="72" fill="#FFC700" fontFamily="sans-serif" fontWeight="bold" fontSize="10" textAnchor="middle">விஜய்</text>
      </svg>
    ),
  },
  {
    id: "StarMaa",
    name: "Star Maa",
    renderLogo: () => (
      <svg viewBox="0 0 100 80" className="h-20 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10 L58 30 L80 30 L62 40 L68 60 L50 48 L32 60 L38 40 L20 30 L42 30 Z" fill="#FF1E27" stroke="#FFC700" strokeWidth="1.5" />
        <text x="50" y="66" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="7" textAnchor="middle">Star</text>
        <text x="50" y="74" fill="#FFC700" fontFamily="sans-serif" fontWeight="900" fontSize="7.5" textAnchor="middle">మా</text>
      </svg>
    ),
  },
  {
    id: "StarPravah",
    name: "Star Pravah",
    renderLogo: () => (
      <svg viewBox="0 0 100 80" className="h-20 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10 L58 30 L80 30 L62 40 L68 60 L50 48 L32 60 L38 40 L20 30 L42 30 Z" fill="#005EE6" stroke="#FFC700" strokeWidth="1.5" />
        <text x="50" y="66" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="7" textAnchor="middle">Star</text>
        <text x="50" y="74" fill="#FFC700" fontFamily="sans-serif" fontWeight="900" fontSize="7.5" textAnchor="middle">प्रवाह</text>
      </svg>
    ),
  },
];

// ── Browse page ───────────────────────────────────────────────────────────────

export default function Browse() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [moviesByCategory, setMoviesByCategory] = useState<Record<number, Title[]>>({});
  const [extras, setExtras] = useState<Title[]>([]);
  const [seriesList, setSeriesList] = useState<BackendSeries[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [top10Movies, setTop10Movies] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [top10Loading, setTop10Loading] = useState(true);

  const load = useCallback(async () => {
    try {
      setTop10Loading(true);
      const [catRes, movRes, seriesData, continueRes, top10Res] = await Promise.all([
        apiClient.get("/categories?status=active&limit=50"),
        apiClient.get("/movies?status=published&limit=100"),
        fetchSeriesList({ status: "published", limit: 50 }),
        apiClient.get("/user/continue-watching").catch(() => ({ data: { data: { continueWatching: [] } } })),
        apiClient.get("/movies/top-10?language=Hindi").catch(() => null),
      ]);

      const cats: Category[] = catRes.data.data.categories ?? [];
      const movies: BackendMovie[] = movRes.data.data.movies ?? [];
      setCategories(cats);
      
      const finalSeries = [...seriesData];
      DUMMY_SERIES.forEach((ds) => {
        if (!seriesData.some(s => s.title === ds.title)) {
          finalSeries.push(ds);
        }
      });
      setSeriesList(finalSeries);
      setContinueWatching(continueRes.data.data.continueWatching ?? []);

      // Process Top 10 — real data first, fill with dummy fallback
      const top10Raw: BackendMovie[] = top10Res?.data?.data?.movies ?? [];
      const top10Mapped = top10Raw.map(mapMovieToTitle);
      if (top10Mapped.length < 5) {
        const existingNames = new Set(top10Mapped.map((m) => m.name.toLowerCase()));
        DUMMY_MOVIES.forEach((dm) => {
          if (!existingNames.has(dm.name.toLowerCase()) && top10Mapped.length < 10) {
            top10Mapped.push(dm);
          }
        });
        setTop10Movies(top10Mapped.slice(0, 10));
      } else {
        setTop10Movies(top10Mapped.slice(0, 10));
      }

      const byCat: Record<number, Title[]> = {};
      const rest: Title[] = [];
      movies.forEach((m) => {
        const mapped = mapMovieToTitle(m);
        if (m.category_id) {
          if (!byCat[m.category_id]) byCat[m.category_id] = [];
          byCat[m.category_id].push(mapped);
        } else {
          rest.push(mapped);
        }
      });

      // Populate dummy movies
      DUMMY_MOVIES.forEach((dm) => {
        if (!movies.some(m => m.title === dm.name)) {
          const cat = cats.find(c => c.name === dm.category);
          if (cat) {
            if (!byCat[cat.id]) byCat[cat.id] = [];
            byCat[cat.id].push(dm);
          } else {
            rest.push(dm);
          }
        }
      });

      setMoviesByCategory(byCat);
      setExtras(rest);
    } catch {
      // silent — empty state
      setTop10Movies(TOP_10_INDIA_HINDI);
    } finally {
      setLoading(false);
      setTop10Loading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time: re-fetch when content changes in admin
  useSocketEvent(SOCKET_EVENTS.MOVIE_CREATED, load);
  useSocketEvent(SOCKET_EVENTS.MOVIE_UPDATED, load);
  useSocketEvent(SOCKET_EVENTS.MOVIE_DELETED, load);
  useSocketEvent(SOCKET_EVENTS.SERIES_CREATED, load);
  useSocketEvent(SOCKET_EVENTS.SERIES_UPDATED, load);
  useSocketEvent(SOCKET_EVENTS.SERIES_DELETED, load);
  useSocketEvent(SOCKET_EVENTS.CONTENT_PUBLISHED, load);
  useSocketEvent(SOCKET_EVENTS.CONTENT_UNPUBLISHED, load);

  // Derived: trending/new-release rows from all movies
  const allMovies = Object.values(moviesByCategory).flat().concat(extras);
  const trendingMovies = allMovies.filter((t) => t.trending);
  const newReleaseMovies = allMovies.filter((t) => t.newRelease);

  const hasCategoryContent = categories.some(
    (c) => (moviesByCategory[c.id]?.length ?? 0) > 0
  );
  const hasContent = hasCategoryContent || extras.length > 0 || seriesList.length > 0;

  // Custom filters to match the screenshot sections
  const bollywoodMovies = allMovies.filter((t) => t.language === "Hindi");
  const actionMovies = allMovies.filter((t) => t.genres.includes("Action"));
  const dramaMovies = allMovies.filter((t) => t.genres.includes("Drama"));
  const kidsMovies = allMovies.filter(
    (t) => t.genres.includes("Animation") || t.genres.includes("Kids & Family")
  );
  const comedyMovies = allMovies.filter((t) => t.genres.includes("Comedy"));
  const latestMovies = [...allMovies].sort((a, b) => b.year - a.year);

  return (
    <MainLayout flush>
      {/* ── Hero ── */}
      <Hero />

      {/* ── Content area — full viewport width ── */}
      <div className="relative w-full pb-20">

        {/* Top gradient bleed from Hero into content */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-12 z-10"
          style={{
            background:
              "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
          }}
        />

        {loading ? (
          <SkeletonRows />
        ) : !hasContent ? (
          <div className="pt-12">
            <EmptyState />
          </div>
        ) : (
          <div className="pt-6 space-y-1">

            {/* ── Continue Watching ── */}
            {continueWatching.length > 0 && (
              <>
                <EmblaRow heading="Continue Watching">
                  {continueWatching.map((item) => {
                    if (item.type === "movie") {
                      const title = mapMovieToTitle(item);
                      title.progress = item.progress;
                      return (
                        <div key={`movie-${item.id}`} className="shrink-0" style={{ width: "clamp(155px, 13vw, 205px)" }}>
                          <TitleCard title={title} />
                        </div>
                      );
                    } else {
                      const seriesWithProgress = { ...item, progress: item.progress };
                      return (
                        <div key={`series-${item.id}`} className="shrink-0" style={{ width: "clamp(155px, 13vw, 205px)" }}>
                          <SeriesCard s={seriesWithProgress} />
                        </div>
                      );
                    }
                  })}
                </EmblaRow>
                <SectionDivider />
              </>
            )}

            {/* ── Top 10 in India Today — Hindi ── */}
            {top10Movies.length > 0 && (
              <>
                <Top10Row
                  heading="Top 10 in India Today — Hindi"
                  titles={top10Movies}
                  loading={top10Loading}
                />
                <SectionDivider />
              </>
            )}

            {/* ── Trending Now ── */}
            {trendingMovies.length > 0 && (
              <>
                <ContentRow
                  heading="Trending Now"
                  titles={trendingMovies}
                  badge="trending"
                  seeAllHref="/library"
                />
                <SectionDivider />
              </>
            )}

            {/* ── Web Series ── */}
            {seriesList.length > 0 && (
              <>
                <SeriesContentRow
                  heading="Web Series"
                  series={seriesList}
                  badge="series"
                  seeAllHref="/library"
                />
                <SectionDivider />
              </>
            )}

            {/* ── New Releases ── */}
            {newReleaseMovies.length > 0 && (
              <>
                <ContentRow
                  heading="New Releases"
                  titles={newReleaseMovies}
                  badge="new"
                  seeAllHref="/library"
                />
                <SectionDivider />
              </>
            )}

            {/* ── Group 1: Popular Languages, Genres, Channels with Cyan Ambient Glow ── */}
            <div className="ambient-glow-blue space-y-1 py-4">
              {/* Popular Languages */}
              <CustomGridRow heading="Popular Languages" seeAllHref="/library" gridColsClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {POPULAR_LANGUAGES.map((lang) => (
                  <Link
                    key={lang.id}
                    to={`/library?language=${lang.id}`}
                    className="relative w-full overflow-hidden rounded-xl bg-zinc-900 aspect-[1.8/1] cursor-pointer group transition-all duration-300 hover:scale-[1.04] hover:ring-2 hover:ring-white/20 shadow-lg"
                  >
                    <img
                      src={lang.image}
                      alt={lang.name}
                      className="absolute right-0 top-0 h-full w-[60%] object-cover grayscale brightness-90 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${lang.bgGradient} to-transparent w-[90%]`} />
                    <div className={`absolute inset-0 ${lang.bgColor} mix-blend-multiply opacity-40`} />
                    <div className="absolute inset-y-0 left-0 flex flex-col justify-center pl-4 z-10">
                      <span className="text-lg font-bold text-white tracking-wide">{lang.native}</span>
                      <span className="text-xs text-white/50 font-medium mt-0.5">{lang.name}</span>
                    </div>
                  </Link>
                ))}
              </CustomGridRow>
              <SectionDivider />

              {/* Popular Genres */}
              <CustomGridRow heading="Popular Genres" gridColsClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {POPULAR_GENRES.map((gen) => (
                  <Link
                    key={gen.id}
                    to={`/library?genre=${gen.id}`}
                    className="relative w-full overflow-hidden rounded-xl bg-zinc-900 aspect-[1.8/1] cursor-pointer group transition-all duration-300 hover:scale-[1.04] hover:ring-2 hover:ring-white/20 shadow-lg"
                  >
                    <img
                      src={gen.image}
                      alt={gen.name}
                      className="absolute right-0 top-0 h-full w-[65%] object-cover opacity-60 grayscale group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${gen.bgGradient} to-transparent w-[85%]`} />
                    <div className={`absolute inset-0 ${gen.bgColor} mix-blend-multiply opacity-55`} />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 z-10">
                      <span className="text-xl font-bold text-white tracking-wide">{gen.name}</span>
                    </div>
                  </Link>
                ))}
              </CustomGridRow>
              <SectionDivider />

              {/* Popular Channels */}
              <CustomGridRow heading="Popular Channels" gridColsClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {POPULAR_CHANNELS.map((chan) => (
                  <Link
                    key={chan.id}
                    to={`/library?q=${chan.id}`}
                    className="relative w-full overflow-hidden rounded-xl bg-[#121218] border border-white/5 aspect-[1.8/1] cursor-pointer group flex items-center justify-center transition-all duration-300 hover:scale-[1.04] hover:bg-[#161622] hover:border-white/10 shadow-lg"
                  >
                    <div className="transform transition-transform duration-300 group-hover:scale-110">
                      {chan.renderLogo()}
                    </div>
                  </Link>
                ))}
              </CustomGridRow>
            </div>
            <SectionDivider />

            {/* ── Group 2: Movie Rows with Purple Ambient Glow ── */}
            <div className="ambient-glow-purple space-y-1 py-4">
              {/* Bollywood */}
              {bollywoodMovies.length > 0 && (
                <>
                  <ContentRow
                    heading="Bollywood"
                    titles={bollywoodMovies}
                    seeAllHref="/library"
                  />
                  <SectionDivider />
                </>
              )}

              {/* Action */}
              {actionMovies.length > 0 && (
                <>
                  <ContentRow
                    heading="Action"
                    titles={actionMovies}
                    seeAllHref="/library"
                  />
                  <SectionDivider />
                </>
              )}

              {/* Drama */}
              {dramaMovies.length > 0 && (
                <>
                  <ContentRow
                    heading="Drama"
                    titles={dramaMovies}
                    seeAllHref="/library"
                  />
                  <SectionDivider />
                </>
              )}

              {/* Trending Kids */}
              {kidsMovies.length > 0 && (
                <>
                  <ContentRow
                    heading="Trending Kids"
                    titles={kidsMovies}
                    seeAllHref="/library"
                  />
                  <SectionDivider />
                </>
              )}

              {/* Comedy */}
              {comedyMovies.length > 0 && (
                <>
                  <ContentRow
                    heading="Comedy"
                    titles={comedyMovies}
                    seeAllHref="/library"
                  />
                  <SectionDivider />
                </>
              )}

              {/* Latest Movies */}
              {latestMovies.length > 0 && (
                <ContentRow
                  heading="Latest Movies"
                  titles={latestMovies}
                  seeAllHref="/library"
                />
              )}
            </div>

            {/* Bottom breathing room */}
            <div className="h-8" />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
