import { io, Socket } from "socket.io-client";

// ── Event name constants (mirror backend/src/socket/events.js) ────────────────
export const SOCKET_EVENTS = {
  // Content
  MOVIE_CREATED:        "content:movie:created",
  MOVIE_UPDATED:        "content:movie:updated",
  MOVIE_DELETED:        "content:movie:deleted",
  SERIES_CREATED:       "content:series:created",
  SERIES_UPDATED:       "content:series:updated",
  SERIES_DELETED:       "content:series:deleted",
  CONTENT_PUBLISHED:    "content:published",
  CONTENT_UNPUBLISHED:  "content:unpublished",

  // User management
  USER_APPROVED:             "user:approved",
  USER_BLOCKED:              "user:blocked",
  USER_PROFILE_UPDATED:      "user:profile:updated",
  USER_SUBSCRIPTION_CHANGED: "user:subscription:changed",

  // Subscription lifecycle
  SUBSCRIPTION_CREATED:   "subscription:created",
  SUBSCRIPTION_CANCELLED: "subscription:cancelled",
  SUBSCRIPTION_EXPIRED:   "subscription:expired",
  SUBSCRIPTION_RENEWED:   "subscription:renewed",

  // Affiliate
  AFFILIATE_REFERRAL_NEW:        "affiliate:referral:new",
  AFFILIATE_COMMISSION_GENERATED: "affiliate:commission:generated",
  AFFILIATE_STATS_UPDATED:       "affiliate:stats:updated",
  AFFILIATE_PAYOUT_CREATED:      "affiliate:payout:created",

  // Payments
  PAYMENT_COMPLETED: "payment:completed",
  PAYMENT_REFUNDED:  "payment:refunded",
  PAYMENT_INVOICE:   "payment:invoice:created",

  // Dashboard
  DASHBOARD_STATS_UPDATED: "dashboard:stats:updated",
} as const;

const BACKEND_URL = (import.meta.env.VITE_API_URL as string || "http://localhost:5000/api/v1")
  .replace(/\/api\/v1\/?$/, "");

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      // Start with polling (always works), then upgrade to WebSocket.
      // WebSocket-first causes "closed before established" in React StrictMode
      // because StrictMode's cleanup fires before the WS handshake completes.
      transports: ["polling", "websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
    });
  }
  return socket;
}

export function connectSocket(token?: string | null): void {
  const s = getSocket();
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

export function updateSocketToken(token: string | null): void {
  const s = getSocket();
  s.auth = { token: token ?? undefined };
  // If connected, reconnect to pick up new auth
  if (s.connected) {
    s.disconnect().connect();
  }
}
