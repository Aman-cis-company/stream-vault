// StreamVault — INR pricing and static app data

export type Category = "Trending" | "New Releases" | "Most Watched" | "Recommended";

export type ContentRating = "G" | "PG" | "PG-13" | "16+" | "18+" | "21+";
export type WarningFlag = "violence" | "strong_language" | "mature_themes" | "nudity";

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
    quality: "Full HD 1080p",
    screens: 2,
    features: ["Stream on 2 devices", "Full HD 1080p", "Unlimited movies & shows", "Cancel anytime"],
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
    features: ["Stream on 4 devices", "4K Ultra HD + HDR", "Dolby Atmos audio", "Offline downloads", "Save 16%"],
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
    features: ["Stream on 6 devices", "4K Ultra HD + HDR", "Early access premieres", "Offline downloads", "Save 44%"],
    razorpayPlanId: "plan_cinephile_yearly",
  },
];

// ── Dashboard / activity ───────────────────────────────────────────────────

export const recentActivity = [
  { id: "a1", text: 'Resumed watching', time: "2 hours ago", kind: "watch" },
  { id: "a2", text: "Plan renewed — Premium (₹749)", time: "Yesterday", kind: "payment" },
  { id: "a3", text: "Added title to My List", time: "2 days ago", kind: "list" },
  { id: "a4", text: "Affiliate payout processed — ₹8,640", time: "4 days ago", kind: "affiliate" },
];

export const paymentHistory = [
  { id: "INV-2041", date: "May 01, 2025", plan: "Premium (Quarterly)", amount: 749, status: "Paid" },
  { id: "INV-2009", date: "Feb 01, 2025", plan: "Premium (Quarterly)", amount: 749, status: "Paid" },
  { id: "INV-1972", date: "Nov 01, 2024", plan: "Standard (Monthly)", amount: 299, status: "Paid" },
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
  { id: "tm1", name: "Priya Sharma", role: "Film Enthusiast, Mumbai", avatarSeed: 5, text: "StreamVault completely replaced my Hotstar and Netflix subscriptions. The 4K quality is breathtaking and the content library is unmatched. Best streaming value in India by far.", rating: 5 },
  { id: "tm2", name: "Arjun Mehta", role: "Director & Cinephile, Pune", avatarSeed: 12, text: "As someone who works in film, I'm picky about picture quality. StreamVault's 4K HDR is the real deal — no buffering, no artefacts, just pure cinema. Worth every rupee.", rating: 5 },
  { id: "tm3", name: "Ananya Iyer", role: "Software Engineer, Bangalore", avatarSeed: 47, text: "The smart recommendations are eerily good. It knew I'd love Korean thrillers before I did. The offline download on the Premium plan is a lifesaver for my commute.", rating: 5 },
  { id: "tm4", name: "Rahul Verma", role: "Tech Reviewer, Delhi", avatarSeed: 22, text: "Tried all major platforms — StreamVault wins on content depth and streaming quality both. The Cinephile plan with 6 screens is perfect for the whole family.", rating: 4 },
  { id: "tm5", name: "Deepika Nair", role: "Documentary Lover, Chennai", avatarSeed: 33, text: "The documentary collection alone is worth the subscription. Incredible breadth from nature to true crime to political dramas. No other platform comes close at this price.", rating: 5 },
  { id: "tm6", name: "Vikram Patel", role: "Weekend Streamer, Ahmedabad", avatarSeed: 61, text: "My whole family uses StreamVault on different devices simultaneously. Six screens on the Cinephile plan means no more fighting over the TV. Best value for money.", rating: 5 },
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
  { name: "Action", count: 342, seed: "svgenre-action", redirect: 2, src: 'Action.png' },
  { name: "Trending Now", count: 518, seed: "svgenre-drama", redirect: 3, src: 'tranding_now.jpg' },
  { name: "Sports", count: 287, seed: "svgenre-sports", redirect: 6, src: 'sport.png' },
  { name: "TV Shows", count: 394, seed: "svgenre-shows", redirect: 5, src: 'tv_shows.jpg' },
  { name: "Comedy", count: 463, seed: "svgenre-comedy", redirect: 1, src: 'comedy.png' },
  { name: "Animation", count: 221, seed: "svgenre-animation", redirect: 8, src: 'animation.jpg' },
  { name: "Crime", count: 312, seed: "svgenre-crime", redirect: 7, src: 'crime.jpg' },
  { name: "Horror", count: 178, seed: "svgenre-horror", redirect: 4, src: 'horror.jpg' },
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
  { id: "u01", name: "Priya Sharma", email: "priya@demo.com", plan: "Premium", status: "Active", joined: "Jan 12, 2025", totalSpentInr: 7481, country: "India", avatarSeed: 5, watchHours: 312 },
  { id: "u02", name: "Arjun Mehta", email: "arjun@demo.com", plan: "Standard", status: "Active", joined: "Feb 3, 2025", totalSpentInr: 2990, country: "India", avatarSeed: 12, watchHours: 88 },
  { id: "u03", name: "Sam Rivera", email: "sam@demo.com", plan: "Cinephile", status: "Suspended", joined: "Nov 20, 2024", totalSpentInr: 15990, country: "USA", avatarSeed: 22, watchHours: 540 },
  { id: "u04", name: "Casey Kim", email: "casey@demo.com", plan: "Premium", status: "Active", joined: "Mar 7, 2025", totalSpentInr: 4987, country: "South Korea", avatarSeed: 47, watchHours: 204 },
  { id: "u05", name: "Ananya Iyer", email: "ananya@demo.com", plan: "Cinephile", status: "Active", joined: "Oct 14, 2024", totalSpentInr: 23980, country: "India", avatarSeed: 33, watchHours: 892 },
  { id: "u06", name: "Liam Torres", email: "liam@demo.com", plan: "Standard", status: "Active", joined: "Apr 22, 2025", totalSpentInr: 1196, country: "Spain", avatarSeed: 61, watchHours: 42 },
  { id: "u07", name: "Emma Wilson", email: "emma@demo.com", plan: "Premium", status: "Active", joined: "Dec 1, 2024", totalSpentInr: 9975, country: "UK", avatarSeed: 15, watchHours: 418 },
  { id: "u08", name: "Rahul Verma", email: "rahul@demo.com", plan: "Premium", status: "Active", joined: "Jan 30, 2025", totalSpentInr: 4987, country: "India", avatarSeed: 29, watchHours: 177 },
  { id: "u09", name: "Vikram Patel", email: "vikram@demo.com", plan: "Cinephile", status: "Active", joined: "Sep 5, 2024", totalSpentInr: 31984, country: "India", avatarSeed: 44, watchHours: 1104 },
  { id: "u10", name: "Miles Carter", email: "miles@demo.com", plan: "Standard", status: "Cancelled", joined: "Feb 17, 2025", totalSpentInr: 2093, country: "Australia", avatarSeed: 58, watchHours: 63 },
  { id: "u11", name: "Sofia Reyes", email: "sofia@demo.com", plan: "Premium", status: "Active", joined: "Mar 28, 2025", totalSpentInr: 2493, country: "Brazil", avatarSeed: 68, watchHours: 95 },
  { id: "u12", name: "Ethan Park", email: "ethan@demo.com", plan: "Cinephile", status: "Active", joined: "Aug 11, 2024", totalSpentInr: 39980, country: "Canada", avatarSeed: 8, watchHours: 1340 },
  { id: "u13", name: "Deepika Nair", email: "deepika@demo.com", plan: "Standard", status: "Active", joined: "May 2, 2025", totalSpentInr: 1196, country: "India", avatarSeed: 36, watchHours: 28 },
  { id: "u14", name: "Tyler Brooks", email: "tyler@demo.com", plan: "Premium", status: "Suspended", joined: "Jan 5, 2025", totalSpentInr: 7481, country: "USA", avatarSeed: 25, watchHours: 267 },
  { id: "u15", name: "Luna Ferreira", email: "luna@demo.com", plan: "Cinephile", status: "Active", joined: "Nov 9, 2024", totalSpentInr: 23980, country: "Portugal", avatarSeed: 55, watchHours: 731 },
];

export const adminRecentActivity = [
  { id: "ra1", type: "signup", text: "New signup: Deepika Nair (Standard — ₹299/mo)", time: "5 min ago" },
  { id: "ra2", type: "upgrade", text: "Ethan Park upgraded to Cinephile (₹1,999/yr)", time: "1 hour ago" },
  { id: "ra3", type: "payment", text: "Payment received: Luna Ferreira — ₹1,999", time: "2 hours ago" },
  { id: "ra4", type: "suspend", text: "Account suspended: Tyler Brooks (policy violation)", time: "3 hours ago" },
  { id: "ra5", type: "signup", text: "New signup: Sofia Reyes (Premium — ₹749/qtr)", time: "5 hours ago" },
  { id: "ra6", type: "payment", text: "Affiliate payout: ₹24,800 to 8 affiliates", time: "Yesterday" },
  { id: "ra7", type: "upgrade", text: "Rahul Verma renewed Premium plan (₹749)", time: "Yesterday" },
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
