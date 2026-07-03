// StreamVault — INR pricing and static app data
import type { BackendSeries } from "@/lib/series";

export type Category =
  | "Trending"
  | "New Releases"
  | "Most Watched"
  | "Recommended";

export type ContentRating = "G" | "PG" | "PG-13" | "16+" | "18+" | "21+";
export type WarningFlag =
  | "violence"
  | "strong_language"
  | "mature_themes"
  | "nudity";

export interface Title {
  id: string;
  name: string;
  category: Category;
  genres: string[];
  year: number;
  durationMin: number;
  maturity: string;
  rating: number;
  hue: number;
  synopsis: string;
  trending?: boolean;
  newRelease?: boolean;
  progress?: number;
  posterUrl: string;
  backdropUrl: string;
  director: string;
  cast: string[];
  hlsUrl: string;
  language: string;
  content_rating?: ContentRating | null;
  is_age_restricted?: boolean;
  minimum_age?: number | null;
  warning_flags_json?: WarningFlag[] | null;
  transcoding_status?: "pending" | "processing" | "completed" | "failed" | null;
  subtitle_url?: string | null;
  dubbed_audio_url?: string | null;
}

export interface Plan {
  id: string;
  backendPlanId: number;
  name: string;
  cadence: "Monthly" | "Quarterly" | "Yearly";
  priceInr: number;
  perMonthInr: number;
  quality: string;
  screens: number;
  features: string[];
  highlight?: boolean;
  razorpayPlanId?: string;
}

// ── Plans (INR) ──────────────────────────────────────────────────────────────

export const plans: Plan[] = [
  {
    id: "monthly",
    backendPlanId: 1,
    name: "Standard",
    cadence: "Monthly",
    priceInr: 299,
    perMonthInr: 299,
    quality: "HD 720p",
    screens: 2,
    features: [
      "Stream on 2 devices",
      "HD 720p",
      "Unlimited movies & shows",
      "Cancel anytime",
    ],
    razorpayPlanId: "plan_standard_monthly",
  },
  {
    id: "quarterly",
    backendPlanId: 2,
    name: "Premium",
    cadence: "Quarterly",
    priceInr: 749,
    perMonthInr: 250,
    quality: "4K Ultra HD + HDR",
    screens: 4,
    features: [
      "Stream on 4 devices",
      "4K Ultra HD + HDR",
      "Dolby Atmos audio",
      "Offline downloads",
      "Save 16%",
    ],
    highlight: true,
    razorpayPlanId: "plan_premium_quarterly",
  },
  {
    id: "yearly",
    backendPlanId: 3,
    name: "Cinephile",
    cadence: "Yearly",
    priceInr: 1999,
    perMonthInr: 167,
    quality: "4K Ultra HD + HDR",
    screens: 6,
    features: [
      "Stream on 6 devices",
      "4K Ultra HD + HDR",
      "Early access premieres",
      "Offline downloads",
      "Save 44%",
    ],
    razorpayPlanId: "plan_cinephile_yearly",
  },
];

// ── Dashboard / activity ───────────────────────────────────────────────────

export const recentActivity = [
  { id: "a1", text: "Resumed watching", time: "2 hours ago", kind: "watch" },
  {
    id: "a2",
    text: "Plan renewed — Premium (₹749)",
    time: "Yesterday",
    kind: "payment",
  },
  {
    id: "a3",
    text: "Added title to My List",
    time: "2 days ago",
    kind: "list",
  },
  {
    id: "a4",
    text: "Affiliate payout processed — ₹8,640",
    time: "4 days ago",
    kind: "affiliate",
  },
];

export const paymentHistory = [
  {
    id: "INV-2041",
    date: "May 01, 2025",
    plan: "Premium (Quarterly)",
    amount: 749,
    status: "Paid",
  },
  {
    id: "INV-2009",
    date: "Feb 01, 2025",
    plan: "Premium (Quarterly)",
    amount: 749,
    status: "Paid",
  },
  {
    id: "INV-1972",
    date: "Nov 01, 2024",
    plan: "Standard (Monthly)",
    amount: 299,
    status: "Paid",
  },
];

export const revenueData = [
  { month: "Jan", revenue: 1420000, users: 1240 },
  { month: "Feb", revenue: 1680000, users: 1480 },
  { month: "Mar", revenue: 1920000, users: 1690 },
  { month: "Apr", revenue: 1810000, users: 1820 },
  { month: "May", revenue: 2240000, users: 2110 },
  { month: "Jun", revenue: 2590000, users: 2460 },
];

export const affiliateStats = {
  referralLink: "https://streamvault.app/r/alex-9f3k",
  clicks: 3842,
  signups: 214,
  earnings: 144468,
  earningsFormatted: "₹1,44,468",
  conversion: 5.6,
};

export const affiliatePerf = [
  { day: "Mon", clicks: 420, revenue: 14000 },
  { day: "Tue", clicks: 510, revenue: 18600 },
  { day: "Wed", clicks: 380, revenue: 11600 },
  { day: "Thu", clicks: 640, revenue: 24800 },
  { day: "Fri", clicks: 720, revenue: 31800 },
  { day: "Sat", clicks: 590, revenue: 21700 },
  { day: "Sun", clicks: 480, revenue: 16300 },
];

// ── Testimonials ──────────────────────────────────────────────────────────

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatarSeed: number;
  text: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    id: "tm1",
    name: "Priya Sharma",
    role: "Film Enthusiast, Mumbai",
    avatarSeed: 5,
    text: "StreamVault completely replaced my Hotstar and Netflix subscriptions. The 4K quality is breathtaking and the content library is unmatched. Best streaming value in India by far.",
    rating: 5,
  },
  {
    id: "tm2",
    name: "Arjun Mehta",
    role: "Director & Cinephile, Pune",
    avatarSeed: 12,
    text: "As someone who works in film, I'm picky about picture quality. StreamVault's 4K HDR is the real deal — no buffering, no artefacts, just pure cinema. Worth every rupee.",
    rating: 5,
  },
  {
    id: "tm3",
    name: "Ananya Iyer",
    role: "Software Engineer, Bangalore",
    avatarSeed: 47,
    text: "The smart recommendations are eerily good. It knew I'd love Korean thrillers before I did. The offline download on the Premium plan is a lifesaver for my commute.",
    rating: 5,
  },
  {
    id: "tm4",
    name: "Rahul Verma",
    role: "Tech Reviewer, Delhi",
    avatarSeed: 22,
    text: "Tried all major platforms — StreamVault wins on content depth and streaming quality both. The Cinephile plan with 6 screens is perfect for the whole family.",
    rating: 4,
  },
  {
    id: "tm5",
    name: "Deepika Nair",
    role: "Documentary Lover, Chennai",
    avatarSeed: 33,
    text: "The documentary collection alone is worth the subscription. Incredible breadth from nature to true crime to political dramas. No other platform comes close at this price.",
    rating: 5,
  },
  {
    id: "tm6",
    name: "Vikram Patel",
    role: "Weekend Streamer, Ahmedabad",
    avatarSeed: 61,
    text: "My whole family uses StreamVault on different devices simultaneously. Six screens on the Cinephile plan means no more fighting over the TV. Best value for money.",
    rating: 5,
  },
];

// ── Genre cards ──────────────────────────────────────────────────────────

export interface GenreCard {
  name: string;
  count: number;
  seed: string;
  redirect?: number;
  src?: string;
}

export const genres: GenreCard[] = [
  {
    name: "Action",
    count: 342,
    seed: "svgenre-action",
    redirect: 2,
    src: "Action.png",
  },
  {
    name: "Trending Now",
    count: 518,
    seed: "svgenre-drama",
    redirect: 3,
    src: "tranding_now.jpg",
  },
  {
    name: "Sports",
    count: 287,
    seed: "svgenre-sports",
    redirect: 6,
    src: "sport.png",
  },
  {
    name: "TV Shows",
    count: 394,
    seed: "svgenre-shows",
    redirect: 5,
    src: "tv_shows.jpg",
  },
  {
    name: "Comedy",
    count: 463,
    seed: "svgenre-comedy",
    redirect: 1,
    src: "comedy.png",
  },
  {
    name: "Animation",
    count: 221,
    seed: "svgenre-animation",
    redirect: 8,
    src: "animation.jpg",
  },
  {
    name: "Crime",
    count: 312,
    seed: "svgenre-crime",
    redirect: 7,
    src: "crime.jpg",
  },
  {
    name: "Horror",
    count: 178,
    seed: "svgenre-horror",
    redirect: 4,
    src: "horror.jpg",
  },
];

// ── Admin ─────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: "Standard" | "Premium" | "Cinephile";
  status: "Active" | "Suspended" | "Cancelled";
  joined: string;
  totalSpentInr: number;
  country: string;
  avatarSeed: number;
  watchHours: number;
}

export const adminUsers: AdminUser[] = [
  {
    id: "u01",
    name: "Priya Sharma",
    email: "priya@demo.com",
    plan: "Premium",
    status: "Active",
    joined: "Jan 12, 2025",
    totalSpentInr: 7481,
    country: "India",
    avatarSeed: 5,
    watchHours: 312,
  },
  {
    id: "u02",
    name: "Arjun Mehta",
    email: "arjun@demo.com",
    plan: "Standard",
    status: "Active",
    joined: "Feb 3, 2025",
    totalSpentInr: 2990,
    country: "India",
    avatarSeed: 12,
    watchHours: 88,
  },
  {
    id: "u03",
    name: "Sam Rivera",
    email: "sam@demo.com",
    plan: "Cinephile",
    status: "Suspended",
    joined: "Nov 20, 2024",
    totalSpentInr: 15990,
    country: "USA",
    avatarSeed: 22,
    watchHours: 540,
  },
  {
    id: "u04",
    name: "Casey Kim",
    email: "casey@demo.com",
    plan: "Premium",
    status: "Active",
    joined: "Mar 7, 2025",
    totalSpentInr: 4987,
    country: "South Korea",
    avatarSeed: 47,
    watchHours: 204,
  },
  {
    id: "u05",
    name: "Ananya Iyer",
    email: "ananya@demo.com",
    plan: "Cinephile",
    status: "Active",
    joined: "Oct 14, 2024",
    totalSpentInr: 23980,
    country: "India",
    avatarSeed: 33,
    watchHours: 892,
  },
  {
    id: "u06",
    name: "Liam Torres",
    email: "liam@demo.com",
    plan: "Standard",
    status: "Active",
    joined: "Apr 22, 2025",
    totalSpentInr: 1196,
    country: "Spain",
    avatarSeed: 61,
    watchHours: 42,
  },
  {
    id: "u07",
    name: "Emma Wilson",
    email: "emma@demo.com",
    plan: "Premium",
    status: "Active",
    joined: "Dec 1, 2024",
    totalSpentInr: 9975,
    country: "UK",
    avatarSeed: 15,
    watchHours: 418,
  },
  {
    id: "u08",
    name: "Rahul Verma",
    email: "rahul@demo.com",
    plan: "Premium",
    status: "Active",
    joined: "Jan 30, 2025",
    totalSpentInr: 4987,
    country: "India",
    avatarSeed: 29,
    watchHours: 177,
  },
  {
    id: "u09",
    name: "Vikram Patel",
    email: "vikram@demo.com",
    plan: "Cinephile",
    status: "Active",
    joined: "Sep 5, 2024",
    totalSpentInr: 31984,
    country: "India",
    avatarSeed: 44,
    watchHours: 1104,
  },
  {
    id: "u10",
    name: "Miles Carter",
    email: "miles@demo.com",
    plan: "Standard",
    status: "Cancelled",
    joined: "Feb 17, 2025",
    totalSpentInr: 2093,
    country: "Australia",
    avatarSeed: 58,
    watchHours: 63,
  },
  {
    id: "u11",
    name: "Sofia Reyes",
    email: "sofia@demo.com",
    plan: "Premium",
    status: "Active",
    joined: "Mar 28, 2025",
    totalSpentInr: 2493,
    country: "Brazil",
    avatarSeed: 68,
    watchHours: 95,
  },
  {
    id: "u12",
    name: "Ethan Park",
    email: "ethan@demo.com",
    plan: "Cinephile",
    status: "Active",
    joined: "Aug 11, 2024",
    totalSpentInr: 39980,
    country: "Canada",
    avatarSeed: 8,
    watchHours: 1340,
  },
  {
    id: "u13",
    name: "Deepika Nair",
    email: "deepika@demo.com",
    plan: "Standard",
    status: "Active",
    joined: "May 2, 2025",
    totalSpentInr: 1196,
    country: "India",
    avatarSeed: 36,
    watchHours: 28,
  },
  {
    id: "u14",
    name: "Tyler Brooks",
    email: "tyler@demo.com",
    plan: "Premium",
    status: "Suspended",
    joined: "Jan 5, 2025",
    totalSpentInr: 7481,
    country: "USA",
    avatarSeed: 25,
    watchHours: 267,
  },
  {
    id: "u15",
    name: "Luna Ferreira",
    email: "luna@demo.com",
    plan: "Cinephile",
    status: "Active",
    joined: "Nov 9, 2024",
    totalSpentInr: 23980,
    country: "Portugal",
    avatarSeed: 55,
    watchHours: 731,
  },
];

export const adminRecentActivity = [
  {
    id: "ra1",
    type: "signup",
    text: "New signup: Deepika Nair (Standard — ₹299/mo)",
    time: "5 min ago",
  },
  {
    id: "ra2",
    type: "upgrade",
    text: "Ethan Park upgraded to Cinephile (₹1,999/yr)",
    time: "1 hour ago",
  },
  {
    id: "ra3",
    type: "payment",
    text: "Payment received: Luna Ferreira — ₹1,999",
    time: "2 hours ago",
  },
  {
    id: "ra4",
    type: "suspend",
    text: "Account suspended: Tyler Brooks (policy violation)",
    time: "3 hours ago",
  },
  {
    id: "ra5",
    type: "signup",
    text: "New signup: Sofia Reyes (Premium — ₹749/qtr)",
    time: "5 hours ago",
  },
  {
    id: "ra6",
    type: "payment",
    text: "Affiliate payout: ₹24,800 to 8 affiliates",
    time: "Yesterday",
  },
  {
    id: "ra7",
    type: "upgrade",
    text: "Rahul Verma renewed Premium plan (₹749)",
    time: "Yesterday",
  },
];

export const extendedRevenueData = [
  { month: "Nov", revenue: 1100000, users: 980, newUsers: 142 },
  { month: "Dec", revenue: 1300000, users: 1090, newUsers: 178 },
  { month: "Jan", revenue: 1420000, users: 1240, newUsers: 195 },
  { month: "Feb", revenue: 1680000, users: 1480, newUsers: 267 },
  { month: "Mar", revenue: 1920000, users: 1690, newUsers: 231 },
  { month: "Apr", revenue: 1810000, users: 1820, newUsers: 188 },
  { month: "May", revenue: 2240000, users: 2110, newUsers: 312 },
  { month: "Jun", revenue: 2590000, users: 2460, newUsers: 398 },
];

export const planDistribution = [
  { name: "Standard", value: 38, color: "oklch(0.68 0.012 270)" },
  { name: "Premium", value: 45, color: "oklch(0.60 0.24 16)" },
  { name: "Cinephile", value: 17, color: "oklch(0.7 0.16 155)" },
];

export const DUMMY_MOVIES: Title[] = [
  {
    id: "dummy-m1",
    name: "Pathaan",
    category: "Trending",
    genres: ["Action", "Thriller"],
    year: 2023,
    durationMin: 146,
    maturity: "UA",
    rating: 8.4,
    hue: 15,
    synopsis:
      "An Indian spy takes on a rogue mercenary leader with a deadly plan to attack India.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/ketMlZbFHZHb6e0PhKljn2Ld1US.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/gVAa4BPJdDCBoifZVbmKd5b1ikB.jpg",
    director: "Siddharth Anand",
    cast: ["Shah Rukh Khan", "Deepika Padukone", "John Abraham"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "dummy-m2",
    name: "Jawan",
    category: "New Releases",
    genres: ["Action", "Thriller"],
    year: 2023,
    durationMin: 169,
    maturity: "UA",
    rating: 8.6,
    hue: 120,
    synopsis:
      "A personal vendetta drives a man to rectify the wrongs in the society, with help from a group of badass women.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/5LtSjMNw6j3LkG29Oa4O0iY5U8.jpg",
    director: "Atlee",
    cast: ["Shah Rukh Khan", "Nayanthara", "Vijay Sethupathi"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "dummy-m3",
    name: "Animal",
    category: "Most Watched",
    genres: ["Action", "Drama"],
    year: 2023,
    durationMin: 201,
    maturity: "A",
    rating: 7.8,
    hue: 0,
    synopsis:
      "A fierce, troubled son goes to extreme lengths to protect his father, triggering a massive gang war.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/qilYankCYr3n2y2Alp7i0jV1NPe.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/5m0hFKsriUuOs13agLU1FraJA8T.jpg",
    director: "Sandeep Reddy Vanga",
    cast: ["Ranbir Kapoor", "Anil Kapoor", "Bobby Deol", "Rashmika Mandanna"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "dummy-m4",
    name: "Leo",
    category: "Trending",
    genres: ["Action", "Thriller"],
    year: 2023,
    durationMin: 164,
    maturity: "UA",
    rating: 8.2,
    hue: 240,
    synopsis:
      "A mild-mannered cafe owner becomes a local hero, but his past soon catches up with him.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/sv1BmbzF9MLVVREPU4jQBMxBl4e.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/A5zPrUIv0BstbrEzEXMOyWsJfPA.jpg",
    director: "Lokesh Kanagaraj",
    cast: ["Vijay", "Sanjay Dutt", "Trisha"],
    hlsUrl: "",
    language: "Tamil",
  },
  {
    id: "dummy-m5",
    name: "Dunki",
    category: "Recommended",
    genres: ["Comedy", "Drama"],
    year: 2023,
    durationMin: 142,
    maturity: "UA",
    rating: 7.9,
    hue: 180,
    synopsis:
      "A group of friends use a back-door route called 'Donkey Flight' to immigrate to London.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/kPRb1mbVHGop0egQ7153y0lhzGL.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/uuw0PRR4sgGi1IV4CYYpEYtez9y.jpg",
    director: "Rajkumar Hirani",
    cast: ["Shah Rukh Khan", "Taapsee Pannu", "Vicky Kaushal"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "dummy-m6",
    name: "Rocky Aur Rani Kii Prem Kahaani",
    category: "Trending",
    genres: ["Romance", "Drama", "Family"],
    year: 2023,
    durationMin: 168,
    maturity: "UA",
    rating: 8.0,
    hue: 320,
    synopsis:
      "A flamboyant Punjabi guy and an intellectual Bengali journalist fall in love and decide to swap families.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/vTQIqlxUkOuyf2UKhlM2OUaFGKz.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/j6djmR4hi8ULL0xUPQN4ZVyzgVN.jpg",
    director: "Karan Johar",
    cast: ["Ranveer Singh", "Alia Bhatt", "Dharmendra"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "dummy-m7",
    name: "Stree 2",
    category: "New Releases",
    genres: ["Horror", "Comedy"],
    year: 2024,
    durationMin: 135,
    maturity: "UA",
    rating: 8.7,
    hue: 200,
    synopsis:
      "The residents of Chanderi face a new supernatural threat as Stree returns with even more fearsome powers.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/iwEJp4WBM8b3AjCeNcgvv86FEFr.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/fVV0A67kDjTTQ4CvUn8LoletRmI.jpg",
    director: "Amar Kaushik",
    cast: ["Rajkummar Rao", "Shraddha Kapoor", "Aparshakti Khurana"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "dummy-m8",
    name: "Kalki 2898-AD",
    category: "New Releases",
    genres: ["Sci-Fi", "Action", "Mythology"],
    year: 2024,
    durationMin: 181,
    maturity: "UA",
    rating: 8.3,
    hue: 260,
    synopsis:
      "Set in a dystopian future, the story of Lord Kalki's avatar unfolds across a battle between good and evil.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/4P3K5medethmTlsuN7UN5bmnATq.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/mQEmKXSFlzBlSoYgut0VfjxAzoA.jpg",
    director: "Nag Ashwin",
    cast: ["Prabhas", "Deepika Padukone", "Amitabh Bachchan", "Kamal Haasan"],
    hlsUrl: "",
    language: "Telugu",
  },
  {
    id: "dummy-m9",
    name: "RRR",
    category: "New Releases",
    genres: ["Action", "Drama", "Historical"],
    year: 2022,
    durationMin: 182,
    maturity: "UA",
    rating: 9.0,
    hue: 60,
    synopsis:
      "A fictitious story about two legendary revolutionaries and their journey before fighting for their country in 1920s India.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/tjpiEnZBUAA8pdNPRKa5vP2Zpqw.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/kOGM01ZhELmJCxdVObqQbRwXXH3.jpg",
    director: "S.S. Rajamouli",
    cast: ["N. T. Rama Rao Jr.", "Ram Charan", "Ajay Devgn", "Alia Bhatt"],
    hlsUrl: "",
    language: "Telugu",
  },
  {
    id: "dummy-m10",
    name: "12th Fail",
    category: "New Releases",
    genres: ["Drama", "Biographical"],
    year: 2023,
    durationMin: 147,
    maturity: "U",
    rating: 9.1,
    hue: 210,
    synopsis:
      "The true story of IPS Officer Manoj Kumar Sharma, who refused to give up despite failing his 12th-grade exams.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/eebUPRI4Z5e1Z7Hev4JZAwMIFkX.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/6RV2o8PBCEyw9ylOWViV1CtULIF.jpg",
    director: "Vidhu Vinod Chopra",
    cast: ["Vikrant Massey", "Medha Shankar", "Anshuman Pushkar"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "dummy-m11",
    name: "Laapataa Ladies",
    category: "New Releases",
    genres: ["Comedy", "Drama"],
    year: 2023,
    durationMin: 121,
    maturity: "U",
    rating: 8.5,
    hue: 160,
    synopsis:
      "Two newly-wed brides get misplaced during a train journey, uncovering a story of identity and freedom.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/g8kvGupn62RdywcE85QO2S0v3r8.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/uuw0PRR4sgGi1IV4CYYpEYtez9y.jpg",
    director: "Kiran Rao",
    cast: ["Pratibha Ranta", "Nitanshi Goel", "Sparsh Shrivastava"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "dummy-m12",
    name: "Pushpa 2: The Rule",
    category: "New Releases",
    genres: ["Action", "Crime"],
    year: 2024,
    durationMin: 190,
    maturity: "UA",
    rating: 8.8,
    hue: 30,
    synopsis:
      "Pushpa Raj continues his defiant rise against the forces that want to bring him down, cementing his rule.",
    posterUrl:
      "https://image.tmdb.org/t/p/original/xkYGdKuK8jfqvGNCZV1uNdYkIfS.jpg",
    backdropUrl:
      "https://image.tmdb.org/t/p/original/lgbMRcbGAbLr6LxF4wi514TpFpj.jpg",
    director: "Sukumar",
    cast: ["Allu Arjun", "Rashmika Mandanna", "Fahadh Faasil"],
    hlsUrl: "",
    language: "Telugu",
  },
];

// ── Top 10 in India Today – Hindi ─────────────────────────────────────────────
export const TOP_10_INDIA_HINDI: Title[] = [
  {
    id: "top10-h1",
    name: "Stree 2",
    category: "Trending",
    genres: ["Horror", "Comedy"],
    year: 2024,
    durationMin: 135,
    maturity: "UA",
    rating: 8.7,
    hue: 200,
    synopsis: "The residents of Chanderi face a new supernatural threat as Stree returns with even more fearsome powers.",
    posterUrl: "https://image.tmdb.org/t/p/original/iwEJp4WBM8b3AjCeNcgvv86FEFr.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/fVV0A67kDjTTQ4CvUn8LoletRmI.jpg",
    director: "Amar Kaushik",
    cast: ["Rajkummar Rao", "Shraddha Kapoor", "Aparshakti Khurana"],
    hlsUrl: "",
    language: "Hindi",
    trending: true,
  },
  {
    id: "top10-h2",
    name: "Jawan",
    category: "Most Watched",
    genres: ["Action", "Thriller"],
    year: 2023,
    durationMin: 169,
    maturity: "UA",
    rating: 8.6,
    hue: 120,
    synopsis: "A personal vendetta drives a man to rectify the wrongs in the society, with help from a group of badass women.",
    posterUrl: "https://image.tmdb.org/t/p/original/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/5LtSjMNw6j3LkG29Oa4O0iY5U8.jpg",
    director: "Atlee",
    cast: ["Shah Rukh Khan", "Nayanthara", "Vijay Sethupathi"],
    hlsUrl: "",
    language: "Hindi",
    trending: true,
  },
  {
    id: "top10-h3",
    name: "12th Fail",
    category: "Most Watched",
    genres: ["Drama", "Biographical"],
    year: 2023,
    durationMin: 147,
    maturity: "U",
    rating: 9.1,
    hue: 210,
    synopsis: "The true story of IPS Officer Manoj Kumar Sharma, who refused to give up despite failing his 12th-grade exams.",
    posterUrl: "https://image.tmdb.org/t/p/original/eebUPRI4Z5e1Z7Hev4JZAwMIFkX.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/6RV2o8PBCEyw9ylOWViV1CtULIF.jpg",
    director: "Vidhu Vinod Chopra",
    cast: ["Vikrant Massey", "Medha Shankar", "Anshuman Pushkar"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "top10-h4",
    name: "Pathaan",
    category: "Trending",
    genres: ["Action", "Thriller"],
    year: 2023,
    durationMin: 146,
    maturity: "UA",
    rating: 8.4,
    hue: 15,
    synopsis: "An Indian spy takes on a rogue mercenary leader with a deadly plan to attack India.",
    posterUrl: "https://image.tmdb.org/t/p/original/ketMlZbFHZHb6e0PhKljn2Ld1US.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/gVAa4BPJdDCBoifZVbmKd5b1ikB.jpg",
    director: "Siddharth Anand",
    cast: ["Shah Rukh Khan", "Deepika Padukone", "John Abraham"],
    hlsUrl: "",
    language: "Hindi",
    trending: true,
  },
  {
    id: "top10-h5",
    name: "Animal",
    category: "Most Watched",
    genres: ["Action", "Drama"],
    year: 2023,
    durationMin: 201,
    maturity: "A",
    rating: 7.8,
    hue: 0,
    synopsis: "A fierce, troubled son goes to extreme lengths to protect his father, triggering a massive gang war.",
    posterUrl: "https://image.tmdb.org/t/p/original/qilYankCYr3n2y2Alp7i0jV1NPe.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/5m0hFKsriUuOs13agLU1FraJA8T.jpg",
    director: "Sandeep Reddy Vanga",
    cast: ["Ranbir Kapoor", "Anil Kapoor", "Bobby Deol", "Rashmika Mandanna"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "top10-h6",
    name: "Rocky Aur Rani Kii Prem Kahaani",
    category: "Trending",
    genres: ["Romance", "Drama", "Family"],
    year: 2023,
    durationMin: 168,
    maturity: "UA",
    rating: 8.0,
    hue: 320,
    synopsis: "A flamboyant Punjabi guy and an intellectual Bengali journalist fall in love and decide to swap families.",
    posterUrl: "https://image.tmdb.org/t/p/original/vTQIqlxUkOuyf2UKhlM2OUaFGKz.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/j6djmR4hi8ULL0xUPQN4ZVyzgVN.jpg",
    director: "Karan Johar",
    cast: ["Ranveer Singh", "Alia Bhatt", "Dharmendra"],
    hlsUrl: "",
    language: "Hindi",
    trending: true,
  },
  {
    id: "top10-h7",
    name: "Laapataa Ladies",
    category: "Most Watched",
    genres: ["Comedy", "Drama"],
    year: 2023,
    durationMin: 121,
    maturity: "U",
    rating: 8.5,
    hue: 160,
    synopsis: "Two newly-wed brides get misplaced during a train journey, uncovering a story of identity and freedom.",
    posterUrl: "https://image.tmdb.org/t/p/original/g8kvGupn62RdywcE85QO2S0v3r8.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/uuw0PRR4sgGi1IV4CYYpEYtez9y.jpg",
    director: "Kiran Rao",
    cast: ["Pratibha Ranta", "Nitanshi Goel", "Sparsh Shrivastava"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "top10-h8",
    name: "Dunki",
    category: "Recommended",
    genres: ["Comedy", "Drama"],
    year: 2023,
    durationMin: 142,
    maturity: "UA",
    rating: 7.9,
    hue: 180,
    synopsis: "A group of friends use a back-door route called 'Donkey Flight' to immigrate to London.",
    posterUrl: "https://image.tmdb.org/t/p/original/kPRb1mbVHGop0egQ7153y0lhzGL.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/uuw0PRR4sgGi1IV4CYYpEYtez9y.jpg",
    director: "Rajkumar Hirani",
    cast: ["Shah Rukh Khan", "Taapsee Pannu", "Vicky Kaushal"],
    hlsUrl: "",
    language: "Hindi",
  },
  {
    id: "top10-h9",
    name: "Bhool Bhulaiyaa 3",
    category: "New Releases",
    genres: ["Horror", "Comedy"],
    year: 2024,
    durationMin: 158,
    maturity: "UA",
    rating: 7.5,
    hue: 280,
    synopsis: "The doors of Manjulika's haveli open once again, bringing back terrifying mysteries and hilarious chaos.",
    posterUrl: "https://image.tmdb.org/t/p/original/hQGviO5YBXZz7RHkVEd8u8K3wfE.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/gVAa4BPJdDCBoifZVbmKd5b1ikB.jpg",
    director: "Anees Bazmee",
    cast: ["Kartik Aaryan", "Vidya Balan", "Madhuri Dixit", "Triptii Dimri"],
    hlsUrl: "",
    language: "Hindi",
    newRelease: true,
  },
  {
    id: "top10-h10",
    name: "Singham Again",
    category: "New Releases",
    genres: ["Action", "Drama"],
    year: 2024,
    durationMin: 144,
    maturity: "UA",
    rating: 7.6,
    hue: 40,
    synopsis: "Bajirao Singham returns for an epic battle against a powerful and ruthless villain, assembling the ultimate cop universe.",
    posterUrl: "https://image.tmdb.org/t/p/original/4P3K5medethmTlsuN7UN5bmnATq.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/mQEmKXSFlzBlSoYgut0VfjxAzoA.jpg",
    director: "Rohit Shetty",
    cast: ["Ajay Devgn", "Akshay Kumar", "Ranveer Singh", "Deepika Padukone", "Tiger Shroff"],
    hlsUrl: "",
    language: "Hindi",
    newRelease: true,
  },
];

export const DUMMY_SERIES: BackendSeries[] = [
  {
    id: 101,
    title: "Mirzapur",
    description:
      "A shocking incident at a wedding procession ignites a series of events affecting the lives of two families in the lawless city of Mirzapur.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "mirzapur",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/5HkbpfYjoHoEmC1F5YLYPbI3ub2.jpg",
    language: "Hindi",
    content_rating: "18+",
    is_age_restricted: true,
    minimum_age: 18,
    warning_flags_json: ["violence", "strong_language", "mature_themes"],
    is_featured: true,
    total_seasons: 2,
    release_date: "2018-11-16",
    category_id: null,
  },
  {
    id: 102,
    title: "The Family Man",
    description:
      "A middle-class man secretly works for a special cell of the National Investigation Agency, protecting the nation from terror threats.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "the-family-man",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/l6YvPa15NPBS8IuLbh0EhVUBBRl.jpg",
    language: "Hindi",
    content_rating: "16+",
    is_age_restricted: false,
    minimum_age: 16,
    warning_flags_json: ["violence", "strong_language"],
    is_featured: true,
    total_seasons: 2,
    release_date: "2019-09-20",
    category_id: null,
  },
  {
    id: 103,
    title: "Sacred Games",
    description:
      "A link in their pasts leads an honest cop to a fugitive gang boss, whose cryptic warning spurs the officer on a quest to save Mumbai from cataclysm.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "sacred-games",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/v68l72g8ycIt4t2sAfoUEoyvjJr.jpg",
    language: "Hindi",
    content_rating: "18+",
    is_age_restricted: true,
    minimum_age: 18,
    warning_flags_json: [
      "violence",
      "strong_language",
      "mature_themes",
      "nudity",
    ],
    is_featured: true,
    total_seasons: 2,
    release_date: "2018-07-05",
    category_id: null,
  },
  {
    id: 104,
    title: "Panchayat",
    description:
      "An engineering graduate takes up a low-salary job as a secretary of a rural panchayat office in a remote village due to lack of better job options.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "panchayat",
    episodes: [],
    thumbnail_url:
      "https://media.themoviedb.org/t/p/w500/eI9A6lRDgtl0Vs2aPrSvQ3fvF3z.jpg",
    language: "Hindi",
    content_rating: "PG",
    is_age_restricted: false,
    minimum_age: null,
    warning_flags_json: null,
    is_featured: false,
    total_seasons: 3,
    release_date: "2020-04-03",
    category_id: null,
  },
  {
    id: 105,
    title: "Asur: Welcome to Your Dark Side",
    description:
      "A unique forensic thriller that pits two opposing worlds against each other: forensic science and the deep mysticism of ancient mythology.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "asur",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/njUrr755WzIrNfuUwQhpu2ljjH4.jpg",
    language: "Hindi",
    content_rating: "16+",
    is_age_restricted: false,
    minimum_age: 16,
    warning_flags_json: ["violence", "mature_themes"],
    is_featured: false,
    total_seasons: 2,
    release_date: "2020-03-02",
    category_id: null,
  },
  {
    id: 106,
    title: "Scam 1992",
    description:
      "The story of Harshad Mehta, a stockbroker who single-handedly took the stock market to dizzying heights and caused one of India's biggest financial scandals.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "scam-1992",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/atKhjwYBA641JbcesyPOfV96QZA.jpg",
    language: "Hindi",
    content_rating: "16+",
    is_age_restricted: false,
    minimum_age: 16,
    warning_flags_json: ["mature_themes"],
    is_featured: true,
    total_seasons: 1,
    release_date: "2020-10-09",
    category_id: null,
  },
  {
    id: 107,
    title: "Kota Factory",
    description:
      "Set in Kota, Rajasthan, the show follows students grinding through JEE preparation, exploring the relentless pressure, friendships and self-discovery.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "kota-factory",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/fMBookmwL6HjIgIVTjQ6EMr3pCH.jpg",
    language: "Hindi",
    content_rating: "16+",
    is_age_restricted: false,
    minimum_age: 16,
    warning_flags_json: ["mature_themes"],
    is_featured: false,
    total_seasons: 3,
    release_date: "2019-04-16",
    category_id: null,
  },
  {
    id: 108,
    title: "Delhi Crime",
    description:
      "Based on the 2012 Delhi gang rape case, Delhi Crime follows the Delhi Police as they investigate and track down the perpetrators.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "delhi-crime",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/xkpkTj6KGsjSaet0VQaq0aTn31D.jpg",
    language: "Hindi",
    content_rating: "18+",
    is_age_restricted: true,
    minimum_age: 18,
    warning_flags_json: ["violence", "mature_themes", "strong_language"],
    is_featured: true,
    total_seasons: 2,
    release_date: "2019-03-22",
    category_id: null,
  },
  {
    id: 109,
    title: "Pataal Lok",
    description:
      "A jaded cop stumbles upon the case of his lifetime when four accused are nabbed for the assassination attempt of a powerful journalist.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "pataal-lok",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/qL8f1E0W42CFHG8NtpyJFMPeKnw.jpg",
    language: "Hindi",
    content_rating: "18+",
    is_age_restricted: true,
    minimum_age: 18,
    warning_flags_json: ["violence", "strong_language", "mature_themes"],
    is_featured: false,
    total_seasons: 1,
    release_date: "2020-05-15",
    category_id: null,
  },
  {
    id: 110,
    title: "Rocket Boys",
    description:
      "The extraordinary lives of Homi J. Bhabha and Vikram Sarabhai, who shaped modern India through their pioneering work in science.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "rocket-boys",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/esNv5JwxVsvu6vZE7bTVeu0mLaA.jpg",
    language: "Hindi",
    content_rating: "PG",
    is_age_restricted: false,
    minimum_age: null,
    warning_flags_json: null,
    is_featured: false,
    total_seasons: 2,
    release_date: "2022-02-04",
    category_id: null,
  },
  {
    id: 111,
    title: "Aarya",
    description:
      "A woman is forced to turn to the dark side of her family's criminal world to protect her children when her husband is attacked.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "aarya",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/eHxzABVwpFtUg5kHu9PAEFWs67u.jpg",
    language: "Hindi",
    content_rating: "16+",
    is_age_restricted: false,
    minimum_age: 16,
    warning_flags_json: ["violence", "mature_themes"],
    is_featured: true,
    total_seasons: 3,
    release_date: "2020-06-19",
    category_id: null,
  },
  {
    id: 112,
    title: "Aspirants",
    description:
      "Three close friends in Delhi pursue their UPSC dreams while navigating love, failure, friendship and the price of ambition.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "aspirants",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/z2yahl2uefxDCl0nogcRBstwY8o.jpg",
    language: "Hindi",
    content_rating: "16+",
    is_age_restricted: false,
    minimum_age: 16,
    warning_flags_json: ["mature_themes"],
    is_featured: false,
    total_seasons: 1,
    release_date: "2021-09-03",
    category_id: null,
  },
  {
    id: 113,
    title: "Breathe: Into the Shadows",
    description:
      "A father is forced to commit crimes to save his missing daughter, while a brilliant cop relentlessly pursues the truth.",
    status: "published",
    createdAt: "",
    updatedAt: "",
    slug: "breathe-into-the-shadows",
    episodes: [],
    thumbnail_url:
      "https://image.tmdb.org/t/p/original/owTpRRYKO4VIuJWTKBSM1oCHF2T.jpg",
    language: "Hindi",
    content_rating: "16+",
    is_age_restricted: false,
    minimum_age: 16,
    warning_flags_json: ["violence", "mature_themes"],
    is_featured: false,
    total_seasons: 2,
    release_date: "2020-07-10",
    category_id: null,
  },
];
