# StreamVault — Complete Project Documentation

> Last updated: 2026-06-08

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Architecture](#3-project-architecture)
4. [Database Design](#4-database-design)
5. [Backend API Reference](#5-backend-api-reference)
6. [Authentication & Authorization Flow](#6-authentication--authorization-flow)
7. [Video Streaming Flow](#7-video-streaming-flow)
8. [Payment & Subscription Flow](#8-payment--subscription-flow)
9. [Admin Portal — Features & How to Use](#9-admin-portal--features--how-to-use)
10. [Frontend Pages & User Flows](#10-frontend-pages--user-flows)
11. [Environment Configuration](#11-environment-configuration)
12. [Database Setup & Seed Data](#12-database-setup--seed-data)
13. [Project Flow — End to End](#13-project-flow--end-to-end)

---

## 1. Project Overview

**StreamVault** is a full-stack on-demand video streaming platform — similar in concept to Netflix. It allows administrators to upload and manage movies and web series, set subscription plans, and control access to content. Regular users subscribe via Stripe, verify their age, and stream content protected behind JWT-authenticated token URLs.

### Core Capabilities

| Area | What it does |
|------|-------------|
| Content Management | Upload movies, web series, episodes with thumbnails |
| Subscriptions | Stripe-powered monthly/yearly plans |
| Streaming | HLS video delivery with signed, time-limited tokens |
| Age Control | Age verification + parental controls with PIN |
| Watch Progress | Resume where you left off across movies and episodes |
| Admin Portal | Dashboard with stats, revenue, subscriber analytics |
| Team Access | Super admin can create team member accounts |

---

## 2. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 7.3 | Build tool & dev server |
| Tailwind CSS | 4.2 | Utility-first styling |
| Redux Toolkit | 2.12 | Global state management |
| Redux Persist | — | Persist auth state across sessions |
| React Router | 7.16 | Client-side routing |
| Axios | — | HTTP client with JWT interceptors |
| HLS.js | 1.6 | Video streaming (HTTP Live Streaming) |
| Radix UI | — | Accessible UI primitives |
| React Hook Form | — | Form management |
| Zod | — | Schema validation |
| Recharts | 2.15 | Charts for admin dashboard |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express.js | 4.18 | HTTP framework |
| MySQL | 5.7+ | Relational database |
| Sequelize | 6.35 | ORM (Object-Relational Mapper) |
| jsonwebtoken | — | JWT access & refresh tokens |
| bcryptjs | — | Password hashing |
| Stripe | — | Payment processing |
| Multer | — | File upload handling |
| Nodemailer | — | Email delivery |
| Helmet | — | HTTP security headers |
| express-rate-limit | — | Rate limiting |
| node-cron | — | Scheduled jobs |
| Winston | — | Application logging |
| Joi | — | Input validation |

### Infrastructure

| Item | Detail |
|------|--------|
| Frontend port | 3000 (dev) |
| Backend port | 5000 |
| Database | MySQL (local) |
| Video CDN | BunnyStream (external CDN) |
| Payments | Stripe Checkout + Subscriptions |
| File storage | Local `backend/uploads/` directory |

---

## 3. Project Architecture

```
┌────────────────────────────────────────────────────────┐
│                      Browser                           │
│          React 19 + Vite (port 3000)                   │
│   Redux Store ─── Axios (/api proxy) ─── React Router  │
└────────────────────┬───────────────────────────────────┘
                     │ HTTP / REST
                     ▼
┌────────────────────────────────────────────────────────┐
│               Express.js API (port 5000)               │
│                                                        │
│  Routes → Controllers → Services → Repositories        │
│                │                        │              │
│           Validators                   ORM             │
│           Middleware                    │              │
│   (Auth, Authorize, RateLimit,          ▼              │
│    Upload, VerifyAge,          ┌────────────────┐      │
│    VerifySubscription)         │   MySQL DB     │      │
│                                │  (Sequelize)   │      │
│  ┌──────────┐  ┌───────────┐   └────────────────┘      │
│  │  Stripe  │  │BunnyStream│                           │
│  │  (Pay)   │  │  (CDN)    │                           │
│  └──────────┘  └───────────┘                           │
└────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Browser Request
    │
    ▼
Vite Proxy (/api → localhost:5000)
    │
    ▼
Express App (app.js)
    ├── Helmet (security headers)
    ├── CORS
    ├── Rate Limiter
    ├── Body Parser (JSON / multipart)
    │
    ▼
Router (routes/index.js)
    │
    ▼
Middleware Chain
    ├── authenticate (verify JWT → req.user)
    ├── authorize (check role)
    ├── verifySubscription (check active plan)
    └── verifyAge (check age verification)
    │
    ▼
Controller (validate input → call Service)
    │
    ▼
Service (business logic → call Repository)
    │
    ▼
Repository (Sequelize queries → DB)
    │
    ▼
JSON Response
```

### Backend Folder Layout

```
backend/src/
├── api/
│   ├── controllers/      ← HTTP layer: parse request, call service, send response
│   ├── services/         ← Business logic
│   ├── repositories/     ← Database queries (Sequelize)
│   ├── middlewares/      ← Auth, roles, rate limiting, uploads
│   ├── routes/           ← Route definitions
│   ├── validators/       ← Joi schema validation
│   └── policies/         ← Authorization policies
├── config/               ← DB, Stripe, mail, logger, BunnyStream
├── constants/            ← Roles, HTTP codes, messages
├── helpers/              ← Token generation, response formatting
├── jobs/                 ← node-cron scheduled tasks
├── migrations/           ← Database schema migrations (18 files)
├── models/               ← Sequelize model definitions (14 models)
├── seeders/              ← Initial seed data
├── utils/                ← Pagination, slugify helpers
├── app.js                ← Express app setup
└── server.js             ← Entry point (start server, cron jobs)
```

---

## 4. Database Design

### 14 Tables & Their Relationships

```
roles ─────────── users ─────────────────────────────────────────┐
                    │                                             │
          ┌─────────┼─────────────────────────┐                  │
          │         │                         │                  │
   refresh_tokens  user_age_verifications  parental_controls     │
                    │                                             │
          ┌─────────┼────────────┐                               │
          │                      │                               │
   user_subscriptions          payments                          │
          │                                                      │
   subscription_plans                                            │
                                                                 │
categories ──── movies ──── watch_history ──────────────────────┘
     │
     └──── series ──── episodes ──── watch_history
```

### Table Definitions

#### `roles`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | Auto increment |
| name | ENUM | `super_admin`, `team_member`, `subscriber` |
| description | TEXT | Human-readable description |
| status | ENUM | `active`, `inactive` |

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| role_id | FK → roles | |
| first_name | VARCHAR | |
| last_name | VARCHAR | |
| email | VARCHAR UNIQUE | |
| password | VARCHAR | bcrypt hashed |
| phone | VARCHAR | Optional |
| avatar | VARCHAR | File path |
| email_verified | BOOLEAN | Default false |
| status | ENUM | `active`, `inactive`, `banned` |
| last_login | DATETIME | |
| reset_token | VARCHAR | Password reset JWT |
| reset_token_expiry | DATETIME | 1-hour window |
| date_of_birth | DATE | |
| age_verified | BOOLEAN | Default false |
| verified_at | DATETIME | |

#### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| name | VARCHAR | |
| slug | VARCHAR UNIQUE | URL-friendly name |
| description | TEXT | |
| status | ENUM | `active`, `inactive` |
| is_age_restricted | BOOLEAN | |
| minimum_age | INT | |
| created_by | FK → users | |
| updated_by | FK → users | |

#### `movies`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| category_id | FK → categories | Nullable |
| title | VARCHAR | |
| slug | VARCHAR UNIQUE | |
| description | TEXT | |
| thumbnail_url | VARCHAR | Path to image |
| provider_name | VARCHAR | Default: `bunny` |
| provider_video_id | VARCHAR | BunnyStream video ID |
| video_url | VARCHAR | Streaming URL |
| duration | INT | Seconds |
| release_date | DATE | |
| is_featured | BOOLEAN | Show in hero/featured rows |
| status | ENUM | `published`, `draft`, `archived` |
| language | VARCHAR | e.g. `English`, `Hindi` |
| content_rating | ENUM | `G`, `PG`, `PG-13`, `16+`, `18+`, `21+` |
| is_age_restricted | BOOLEAN | |
| minimum_age | INT | |
| warning_flags_json | JSON | Array of content warnings |
| created_by | FK → users | |
| updated_by | FK → users | |

#### `series`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| category_id | FK → categories | |
| title | VARCHAR | |
| slug | VARCHAR UNIQUE | |
| description | TEXT | |
| thumbnail_url | VARCHAR | |
| language | VARCHAR | |
| content_rating | ENUM | Same as movies |
| is_age_restricted | BOOLEAN | |
| minimum_age | INT | |
| warning_flags_json | JSON | |
| is_featured | BOOLEAN | |
| status | ENUM | `published`, `draft`, `archived` |
| total_seasons | INT | |
| release_date | DATE | |
| created_by | FK → users | |
| updated_by | FK → users | |

#### `episodes`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| series_id | FK → series | Cascade delete |
| season_number | INT | |
| episode_number | INT | |
| title | VARCHAR | |
| description | TEXT | |
| thumbnail_url | VARCHAR | |
| duration | INT | Seconds |
| provider_name | VARCHAR | Default: `bunny` |
| provider_video_id | VARCHAR | |
| video_url | VARCHAR | |
| status | ENUM | `published`, `draft`, `archived` |
| release_date | DATE | |
| created_by | FK → users | |
| updated_by | FK → users | |

#### `subscription_plans`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| name | VARCHAR | e.g. Standard, Premium |
| description | TEXT | |
| price | DECIMAL(10,2) | |
| currency | VARCHAR | Default: `INR` |
| billing_cycle | ENUM | `monthly`, `yearly` |
| stripe_price_id | VARCHAR | Stripe Price ID |
| features_json | JSON | Array of feature strings |
| status | ENUM | `active`, `inactive` |

#### `user_subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| user_id | FK → users | |
| plan_id | FK → subscription_plans | |
| stripe_customer_id | VARCHAR | |
| stripe_subscription_id | VARCHAR | |
| start_date | DATETIME | |
| end_date | DATETIME | |
| status | ENUM | `active`, `expired`, `cancelled`, `pending` |

#### `payments`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| user_id | FK → users | |
| subscription_id | FK → user_subscriptions | Nullable |
| stripe_payment_intent_id | VARCHAR | |
| stripe_session_id | VARCHAR | |
| amount | DECIMAL | |
| currency | VARCHAR | |
| payment_method | VARCHAR | |
| status | ENUM | `succeeded`, `pending`, `failed`, `refunded` |
| paid_at | DATETIME | |

#### `watch_history`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| user_id | FK → users | Cascade delete |
| movie_id | FK → movies | Nullable (movie OR episode) |
| episode_id | FK → episodes | Nullable |
| watch_time | INT | Seconds watched |
| completion_percentage | DECIMAL(5,2) | 0–100 |
| last_watched_at | DATETIME | |

#### `refresh_tokens`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| user_id | FK → users | Cascade delete |
| token | TEXT | UUID-based token string |
| expires_at | DATETIME | |
| is_revoked | BOOLEAN | Default false |

#### `user_age_verifications`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| user_id | FK → users | Cascade delete |
| date_of_birth | DATE | |
| verified_age | INT | Calculated age at verification |
| ip_address | VARCHAR | Audit trail |
| user_agent | VARCHAR | Audit trail |

#### `parental_controls`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| user_id | FK → users | Unique, cascade delete |
| pin_enabled | BOOLEAN | Default false |
| pin_hash | VARCHAR | bcrypt hashed PIN |
| hide_restricted_content | BOOLEAN | |
| max_rating | ENUM | `G`, `PG`, `PG-13`, `16+`, `18+`, `21+` |

---

## 5. Backend API Reference

**Base URL:** `http://localhost:5000/api/v1`

All authenticated routes require the header:
```
Authorization: Bearer <access_token>
```

---

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Returns API status |

---

### Authentication — `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register a new subscriber account |
| POST | `/auth/login` | No | Login and receive access + refresh tokens |
| POST | `/auth/refresh-token` | No | Exchange refresh token for new access token |
| POST | `/auth/logout` | No | Revoke refresh token |
| POST | `/auth/forgot-password` | No | Send password reset email |
| POST | `/auth/reset-password` | No | Reset password using reset token |
| GET | `/auth/profile` | Yes | Get current user's profile |
| PUT | `/auth/profile` | Yes | Update current user's profile |

**Register body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "StrongPass123!",
  "phone": "+91-9876543210"
}
```

**Login response:**
```json
{
  "user": { "id": 1, "email": "...", "role": "subscriber" },
  "accessToken": "eyJ...",
  "refreshToken": "uuid-uuid"
}
```

---

### Categories — `/categories`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/categories` | No | — | List all active categories |
| GET | `/categories/:id` | No | — | Get single category |
| POST | `/categories` | Yes | admin / team | Create new category |
| PUT | `/categories/:id` | Yes | admin / team | Update category |
| DELETE | `/categories/:id` | Yes | super_admin | Delete category |

**Create category body:**
```json
{
  "name": "Action",
  "description": "High-octane action movies",
  "is_age_restricted": false,
  "minimum_age": 0
}
```

---

### Movies — `/movies`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/movies` | No | — | List movies (filterable) |
| GET | `/movies/:id` | No | — | Get movie by ID |
| POST | `/movies` | Yes | admin / team | Upload & create movie |
| PUT | `/movies/:id` | Yes | admin / team | Update movie |
| DELETE | `/movies/:id` | Yes | super_admin | Delete movie |

**GET `/movies` query params:**
```
?status=published
&category_id=2
&search=inception
&limit=20
&page=1
```

**Create movie (multipart/form-data):**
```
title:            Inception
description:      A thief who steals...
category_id:      2
release_date:     2010-07-16
language:         English
content_rating:   PG-13
is_age_restricted: false
minimum_age:      0
is_featured:      true
status:           published
warning_flags_json: ["violence","language"]
thumbnail:        [file upload]
video:            [file upload]
```

---

### Series — `/series`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/series` | No | — | List all series |
| GET | `/series/:id` | No | — | Get series + episodes |
| POST | `/series` | Yes | admin / team | Create new series |
| PUT | `/series/:id` | Yes | admin / team | Update series |
| DELETE | `/series/:id` | Yes | super_admin | Delete series (cascades to episodes) |

---

### Episodes — `/series/:seriesId/episodes`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/series/:sid/episodes` | No | — | List episodes of a series |
| GET | `/series/:sid/episodes/:eid` | No | — | Get single episode |
| POST | `/series/:sid/episodes` | Yes | admin / team | Add episode to series |
| PUT | `/series/:sid/episodes/:eid` | Yes | admin / team | Update episode |
| DELETE | `/series/:sid/episodes/:eid` | Yes | admin / team | Delete episode |

**Create episode (multipart/form-data):**
```
title:          Episode 1 — Pilot
description:    The story begins...
season_number:  1
episode_number: 1
release_date:   2024-01-01
status:         published
thumbnail:      [file upload]
video:          [file upload]
```

---

### Video Streaming — `/videos`

| Method | Endpoint | Auth | Subscription | Description |
|--------|----------|------|-------------|-------------|
| POST | `/videos/token/:movieId` | Yes | Required | Get signed stream token for a movie |
| POST | `/videos/token/episode/:episodeId` | Yes | Required | Get signed stream token for an episode |
| GET | `/videos/stream/:filename?token=xxx` | Token | — | Stream actual video bytes (supports Range) |

**Token response:**
```json
{ "streamUrl": "/api/v1/videos/stream/movie-slug.mp4?token=eyJ..." }
```

---

### Stripe / Payments — `/stripe`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/stripe/plans` | No | — | List active subscription plans |
| GET | `/stripe/plans/all` | Yes | super_admin | List all plans (incl. inactive) |
| PUT | `/stripe/plans/:id` | Yes | super_admin | Update plan details |
| POST | `/stripe/webhook` | — | — | Stripe webhook receiver (raw body) |
| POST | `/stripe/create-customer` | Yes | — | Create Stripe customer for user |
| POST | `/stripe/create-checkout-session` | Yes | — | Start Stripe Checkout for a plan |
| POST | `/stripe/create-subscription` | Yes | — | Create subscription with payment method |
| POST | `/stripe/cancel-subscription` | Yes | — | Cancel active subscription |
| GET | `/stripe/subscription-status` | Yes | — | Get user's current subscription |
| GET | `/stripe/my-payments` | Yes | — | Get user's payment history |
| POST | `/stripe/fulfill-checkout` | Yes | — | Fulfill subscription after checkout |

**Create checkout session body:**
```json
{
  "plan_id": 2,
  "success_url": "https://yourdomain.com/payment/success",
  "cancel_url": "https://yourdomain.com/payment/cancel"
}
```

---

### Watch Progress — `/progress`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/progress/movie/:movieId` | Yes | Save/update movie progress |
| GET | `/progress/movie/:movieId` | Yes | Get movie watch progress |
| PUT | `/progress/episode/:episodeId` | Yes | Save/update episode progress |
| GET | `/progress/episode/:episodeId` | Yes | Get episode watch progress |

**Save progress body:**
```json
{
  "watch_time": 3456,
  "completion_percentage": 57.3
}
```

---

### Age Verification — `/age`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/age/verify` | Yes | Submit date of birth to verify age |
| GET | `/age/status` | Yes | Check if current user is age-verified |

**Verify body:**
```json
{ "date_of_birth": "1995-04-12" }
```

---

### Parental Controls — `/parental-controls`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/parental-controls` | Yes | Get parental control settings |
| POST | `/parental-controls` | Yes | Create/update parental control settings |
| POST | `/parental-controls/verify-pin` | Yes | Verify the parental PIN |

**Set parental controls body:**
```json
{
  "pin_enabled": true,
  "pin": "1234",
  "hide_restricted_content": true,
  "max_rating": "PG-13"
}
```

---

### Dashboard (Admin Analytics) — `/dashboard`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/dashboard/stats` | Yes | super_admin | Overview stats (totals) |
| GET | `/dashboard/revenue` | Yes | super_admin | Revenue by period |
| GET | `/dashboard/subscribers` | Yes | super_admin | Subscriber growth data |
| GET | `/dashboard/movies` | Yes | super_admin | Movies stats |
| GET | `/dashboard/payments` | Yes | super_admin | Payment stats |
| GET | `/dashboard/users` | Yes | super_admin | User stats |

---

### Team Members — `/team-members`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/team-members` | Yes | super_admin | Create a team member account |
| GET | `/team-members` | Yes | super_admin | List all team members |
| PUT | `/team-members/:id` | Yes | super_admin | Update team member |
| DELETE | `/team-members/:id` | Yes | super_admin | Remove team member |

---

## 6. Authentication & Authorization Flow

### Registration Flow

```
User fills signup form
    │
    ▼
POST /auth/register
    │
    ├── Joi validates: first_name, last_name, email, password
    ├── Check email uniqueness
    ├── Hash password (bcrypt, 10 rounds)
    ├── Assign role_id = subscriber
    ├── Create user record
    │
    ▼
Response: { user, accessToken, refreshToken }
    │
    ▼
Redux stores tokens in localStorage
```

### Login Flow

```
User enters email + password
    │
    ▼
POST /auth/login
    │
    ├── Find user by email
    ├── bcrypt.compare(password, stored_hash)
    ├── Generate accessToken (JWT, 1d expiry)
    │       Payload: { id, email, role }
    ├── Generate refreshToken (UUID, 7d expiry)
    ├── Store refreshToken in refresh_tokens table
    ├── Update last_login
    │
    ▼
Response: { user, accessToken, refreshToken }
    │
    ▼
Axios interceptor attaches token to all future requests:
    Authorization: Bearer <accessToken>
```

### Token Refresh Flow

```
Axios receives 401 Unauthorized
    │
    ▼
Interceptor catches error
    │
    ▼
POST /auth/refresh-token { refresh_token }
    │
    ├── Find token in refresh_tokens table
    ├── Check: not expired, not revoked
    ├── Generate new accessToken
    │
    ▼
Retry original request with new token
    │
    ▼ (if refresh also fails)
Logout user → redirect to /login
```

### Authorization (Role Check)

```
Request hits protected route
    │
    ▼
authenticate middleware
    ├── Extract Bearer token from header
    ├── jwt.verify(token, JWT_SECRET)
    ├── Attach req.user = { id, email, role }
    │
    ▼
authorize(['super_admin', 'team_member']) middleware
    ├── Check req.user.role is in allowed roles
    ├── 403 Forbidden if not allowed
    │
    ▼
Controller executes
```

### Three User Roles

| Role | Permissions |
|------|------------|
| **super_admin** | Full access: manage all content, users, plans, view analytics, create team members |
| **team_member** | Create and edit movies, series, episodes, categories. Cannot delete or access dashboard stats |
| **subscriber** | Watch content (with active subscription), manage own profile, parental controls |

---

## 7. Video Streaming Flow

### How Secure Streaming Works

StreamVault uses **token-authenticated streaming** so video URLs cannot be shared or embedded without a valid session.

```
1. Subscriber clicks "Watch"
        │
        ▼
2. Frontend: POST /videos/token/:movieId
   ── Auth: Bearer token
   ── Subscription check: must be active
        │
        ▼
3. VideoTokenService generates a signed JWT
   that embeds the filename and expires in ~60 minutes
        │
        ▼
4. Response: { streamUrl: "/api/v1/videos/stream/filename.mp4?token=eyJ..." }
        │
        ▼
5. HLS.js player loads the streamUrl
        │
        ▼
6. GET /videos/stream/:filename?token=eyJ...
   ── Backend verifies the stream token
   ── Reads video file from uploads/videos/
   ── Sends file with HTTP Range support (seek, scrub)
   ── MIME type detection: mp4, webm, mkv, mov, avi
        │
        ▼
7. Video plays in browser
        │
        ▼
8. Every N seconds, frontend:
   PUT /progress/movie/:movieId
   { watch_time: 1234, completion_percentage: 34.5 }
```

### Progress Resumption

When a user returns to a movie/episode, the player calls `GET /progress/movie/:movieId` and seeks to `watch_time` seconds automatically.

---

## 8. Payment & Subscription Flow

### Stripe Checkout Flow (Recommended)

```
User visits /pricing
        │
        ▼
GET /stripe/plans — shows active plans with price & features
        │
        ▼
User clicks "Subscribe" on a plan
        │
        ▼
POST /stripe/create-checkout-session
  { plan_id, success_url, cancel_url }
        │
        ▼
Stripe Checkout page opens (hosted by Stripe)
        │
        ▼
User enters card details on Stripe's secure page
        │
    ┌───┴────────────────────────┐
    │ Success                    │ Cancel
    ▼                            ▼
/payment/success             /payment/cancel
    │
    ▼
POST /stripe/fulfill-checkout { session_id }
    │
    ├── Retrieve Stripe session
    ├── Create/update user_subscriptions record
    ├── Create payments record (status: succeeded)
    │
    ▼
User now has active subscription
```

### Stripe Webhook (Background Events)

Stripe sends events to `POST /stripe/webhook`:

| Stripe Event | What the system does |
|--------------|---------------------|
| `checkout.session.completed` | Activate subscription record |
| `customer.subscription.updated` | Update status (active → cancelled etc.) |
| `customer.subscription.deleted` | Mark subscription as cancelled |
| `invoice.payment_succeeded` | Record payment success |
| `invoice.payment_failed` | Mark payment as failed |

### Subscription Expiry Job

A `node-cron` job runs periodically (configured in `subscriptionExpiry.job.js`) and automatically marks `user_subscriptions.status = 'expired'` for records past their `end_date`.

---

## 9. Admin Portal — Features & How to Use

The admin portal is at `/admin` (requires `super_admin` or `team_member` login).

**Admin login credentials (seeded):**
```
Email:    admin@streamvault.com
Password: Admin@123456
```

---

### 9.1 Dashboard (`/admin`)

**What it shows:**
- Total subscribers, revenue, movies, series (stat cards)
- Revenue chart (by period)
- Subscriber growth chart
- Recent payments table
- User activity

**How to use:**
- Navigate to `/admin` after logging in as super_admin
- Charts are auto-loaded from `/dashboard/*` endpoints
- Use to monitor business health

---

### 9.2 Categories Management (`/admin/categories`)

Categories organize movies and series (e.g., Action, Drama, Comedy).

**Features:**
- View all categories in a table
- Create a new category
- Edit category name, description, age restriction
- Delete a category (super_admin only)

**How to create a category:**
1. Go to `/admin/categories`
2. Click **"Add Category"**
3. Fill in:
   - **Name** — e.g., `Action`
   - **Description** — brief description
   - **Age Restricted** — toggle if the category contains adult content
   - **Minimum Age** — set numeric minimum age if restricted
4. Click **Save**
5. The category becomes immediately available when adding movies/series

**Fields explained:**
| Field | Purpose |
|-------|---------|
| name | Display name shown to users |
| slug | Auto-generated URL-safe version (e.g., `action`) |
| is_age_restricted | Marks entire category as adult content |
| minimum_age | Minimum age (years) to access this category |
| status | `active` = visible, `inactive` = hidden |

---

### 9.3 Movies Management (`/admin/movies`)

**Features:**
- View all movies with status badges (published, draft, archived)
- Filter by category or search by title
- Upload new movies with thumbnail and video file
- Edit movie details
- Change status (publish, archive)
- Delete a movie (super_admin only)

**How to add a movie:**
1. Go to `/admin/movies`
2. Click **"Add Movie"**
3. Fill in the form:
   - **Title** — movie name
   - **Description** — synopsis
   - **Category** — select from dropdown
   - **Release Date** — original release date
   - **Language** — e.g., English, Hindi
   - **Content Rating** — `G`, `PG`, `PG-13`, `16+`, `18+`, `21+`
   - **Is Age Restricted** — toggle if needed
   - **Minimum Age** — numeric minimum if restricted
   - **Is Featured** — shows movie in hero section / featured row
   - **Status** — `draft` (hidden), `published` (live), `archived` (retired)
   - **Warning Flags** — select applicable content warnings (violence, language, etc.)
   - **Thumbnail** — upload cover image
   - **Video File** — upload mp4/webm/mkv/mov/avi file
4. Click **Save**

**Status meanings:**
| Status | Visible to users? |
|--------|-----------------|
| draft | No — only admins can see |
| published | Yes — all subscribers |
| archived | No — hidden but not deleted |

**Featured flag:**
Setting `is_featured = true` makes the movie appear in the hero banner and "Featured" sections on the browse page.

---

### 9.4 Series Management (`/admin/series`)

**Features:**
- View all web series
- Create a new series (show-level metadata)
- Add episodes to each series by season
- Edit series details
- Delete series (cascades and removes all episodes)

**How to add a series:**
1. Go to `/admin/series`
2. Click **"Add Series"**
3. Fill in:
   - **Title**, **Description**, **Category**
   - **Language**, **Content Rating**
   - **Total Seasons** — number of seasons planned
   - **Release Date**, **Is Featured**, **Status**
   - **Thumbnail** — series cover image
4. Click **Save**

**How to add an episode to a series:**
1. Click the series in the list
2. Click **"Add Episode"**
3. Fill in:
   - **Title** — episode title
   - **Description** — episode synopsis
   - **Season Number** — e.g., `1`
   - **Episode Number** — e.g., `3`
   - **Release Date**
   - **Status** — `published` / `draft`
   - **Thumbnail** — episode thumbnail
   - **Video File** — upload video
4. Click **Save**

Episodes are nested under `series/:seriesId/episodes` in the API. Deleting a series deletes all its episodes.

---

### 9.5 Subscription Plans Management (`/admin/plans`)

**Features:**
- View all subscription plans
- Edit plan name, description, price, features
- Activate / deactivate plans

**Note:** Plans are created in the Stripe dashboard first (to get a `stripe_price_id`), then seeded or created in the database. The super_admin can update plan metadata (name, features list) via the admin UI.

**Default seeded plans:**
| Plan | Billing | Price |
|------|---------|-------|
| Standard | Monthly | ₹INR |
| Premium | Monthly | ₹INR |
| Cinephile | Yearly | ₹INR |

**How to edit a plan:**
1. Go to `/admin/plans`
2. Click **Edit** on a plan
3. Update name, description, features list
4. Click **Save**

**How to deactivate a plan:**
- Set status to `inactive` — the plan will no longer appear on the public `/pricing` page

---

### 9.6 Team Members (`/admin` → Team section)

Super admins can create accounts for team members who can upload and manage content but cannot access billing or dashboard stats.

**How to create a team member:**
1. Go to Team Members section
2. Click **"Add Team Member"**
3. Enter name, email, and temporary password
4. The account is created with `team_member` role

**Team member permissions:**
- Create, edit movies, series, episodes, categories
- Cannot delete content
- Cannot view dashboard analytics
- Cannot manage subscription plans
- Cannot manage other users

---

## 10. Frontend Pages & User Flows

### Public Pages (No login required)

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Hero, features, pricing, testimonials |
| Login | `/login` | Email + password login |
| Signup | `/signup` | New subscriber registration |
| Forgot Password | `/forgot-password` | Request password reset email |
| Pricing | `/pricing` | View subscription plans |

### Authenticated User Pages

| Page | Path | Description |
|------|------|-------------|
| Browse | `/browse` | All movies grid with search/filter |
| Library | `/library` | Movies organized by category |
| Profile | `/profile` | Edit profile, view subscription |
| Watch Movie | `/watch/:titleId` | Video player for a movie |
| Series Detail | `/series/:seriesId` | Series page with season/episode list |
| Watch Episode | `/watch/series/:seriesId/episode/:episodeId` | Video player for episode |
| Parental Controls | `/settings/parental-controls` | Set PIN, rating restrictions |
| Payment Success | `/payment/success` | Post-checkout success page |
| Payment Cancel | `/payment/cancel` | Post-checkout cancellation page |

### Admin Pages (super_admin and team_member)

| Page | Path | Description |
|------|------|-------------|
| Admin Home | `/admin` | Dashboard with analytics |
| Categories | `/admin/categories` | Manage content categories |
| Movies | `/admin/movies` | Upload and manage movies |
| Series | `/admin/series` | Upload and manage web series |
| Plans | `/admin/plans` | Manage subscription plans |

### Complete User Journey

```
New User
  │
  ▼
Visits landing page (/)
  ├── Sees hero section, featured content previews
  ├── Reads features and pricing tiers
  │
  ▼
Clicks "Sign Up" → /signup
  ├── Fills registration form
  ├── Account created with subscriber role
  │
  ▼
Redirected to /browse
  ├── Can see movie thumbnails and titles
  ├── Clicking a movie shows a "Subscribe to watch" prompt
  │
  ▼
Goes to /pricing → selects a plan
  ├── Stripe Checkout opens
  ├── Completes payment
  ├── Redirected to /payment/success
  │
  ▼
Now has active subscription → can watch any content
  │
  ▼
Clicks a movie → /watch/:id
  ├── Frontend requests stream token (POST /videos/token/:movieId)
  ├── If movie is age-restricted → Age Verification Modal appears
  │     ├── User enters date of birth
  │     └── POST /age/verify → verified flag set
  ├── Video streams with HLS.js
  ├── Progress saved every few seconds (PUT /progress/movie/:id)
  │
  ▼
Returns later → video resumes from saved position
```

---

## 11. Environment Configuration

### Frontend (`.env` in project root)

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Backend (`.env` in `backend/`)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=streamvault
DB_PORT=3306

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend (for CORS and email reset links)
FRONTEND_URL=http://localhost:3000

# Email (Nodemailer)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# BunnyStream CDN (optional, for external video hosting)
BUNNY_STREAM_API_KEY=...
BUNNY_STREAM_LIBRARY_ID=...
```

---

## 12. Database Setup & Seed Data

### Initial Setup Commands

```bash
# 1. Go to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create MySQL database
mysql -u root -p -e "CREATE DATABASE streamvault;"

# 4. Run all migrations (creates all 14 tables)
npm run db:migrate

# 5. Seed initial data (roles, admin user, subscription plans)
npm run db:seed

# 6. Start development server
npm run dev
```

### What the Seeders Create

**Roles seeder:**
```
super_admin — Full system access
team_member — Content management
subscriber  — Regular viewing access
```

**Users seeder (default admin):**
```
Email:    admin@streamvault.com
Password: Admin@123456
Role:     super_admin
```

**Subscription plans seeder:**
```
Standard  — Monthly billing
Premium   — Monthly billing
Cinephile — Yearly billing
```

### Reset Database (Development Only)

```bash
npm run db:reset  # Drop all tables, re-migrate, re-seed
```

---

## 13. Project Flow — End to End

### Flow 1: Admin Adds a Movie

```
Admin logs in (admin@streamvault.com / Admin@123456)
    │
    ▼
Navigates to /admin/movies
    │
    ▼
Clicks "Add Movie"
    │
    ▼
Fills form (title, description, category, rating, etc.)
Uploads thumbnail image + video file
    │
    ▼
POST /movies (multipart/form-data)
    ├── authenticate → verify JWT (super_admin)
    ├── authorize → confirm role is admin/team
    ├── Multer → save files to backend/uploads/
    ├── MovieController → call MovieService
    ├── MovieService → slugify title, validate category
    ├── MovieRepository → INSERT into movies table
    │
    ▼
Movie saved with status = "published"
    │
    ▼
Movie appears on /browse for all subscribers
```

---

### Flow 2: New User Subscribes & Watches

```
User registers at /signup
    │
    ▼
POST /auth/register → account created (subscriber role)
    │
    ▼
User browses /browse → clicks a movie → sees "Subscribe" prompt
    │
    ▼
User goes to /pricing → clicks "Get Standard Plan"
    │
    ▼
POST /stripe/create-checkout-session { plan_id: 1 }
    │
    ▼
Stripe Checkout page opens
User enters card → payment success
    │
    ▼
Stripe sends webhook: checkout.session.completed
    │
    ▼
POST /stripe/webhook (background)
    ├── Creates user_subscriptions record (status: active)
    └── Creates payments record (status: succeeded)
    │
    ▼
Browser redirected to /payment/success
    │
    ▼
POST /stripe/fulfill-checkout { session_id }
    ├── Activates subscription in DB
    │
    ▼
User clicks movie → /watch/:movieId
    │
    ▼
POST /videos/token/:movieId
    ├── authenticate → JWT valid
    ├── verifySubscription → subscription active
    ├── VideoTokenService.generate(filename) → signed JWT token
    │
    ▼
Response: { streamUrl: "/api/v1/videos/stream/movie.mp4?token=eyJ..." }
    │
    ▼
HLS.js loads streamUrl → video plays
    │
    ▼
Every 10s: PUT /progress/movie/:movieId { watch_time, completion_percentage }
    │
    ▼
User pauses, comes back later → video resumes from saved position
```

---

### Flow 3: Age-Restricted Content

```
User clicks an age-restricted movie
    │
    ▼
POST /videos/token/:movieId
    │
    ▼
verifyAge middleware checks: user.age_verified === false
    │
    ▼
AgeVerificationModal appears in frontend
    │
    ▼
User enters date of birth
    │
    ▼
POST /age/verify { date_of_birth: "1995-04-12" }
    ├── Calculate age from DOB
    ├── If age >= movie.minimum_age → set age_verified = true
    └── Create user_age_verifications record (with IP + user agent for audit)
    │
    ▼
Frontend retries POST /videos/token/:movieId
    ├── Age now verified → returns streamUrl
    │
    ▼
Video plays
```

---

### Flow 4: Parental Controls

```
Parent (subscriber) goes to /settings/parental-controls
    │
    ▼
POST /parental-controls
{
  pin_enabled: true,
  pin: "1234",
  hide_restricted_content: true,
  max_rating: "PG-13"
}
    │
    ▼
ParentalControlsController
    ├── Hash PIN with bcrypt
    ├── Save to parental_controls table
    │
    ▼
When child accesses content rated above "PG-13":
    ├── Frontend shows "Enter PIN" modal
    ├── POST /parental-controls/verify-pin { pin: "1234" }
    ├── bcrypt.compare → match → access granted
    └── No match → access denied
```

---

### Flow 5: Subscription Expiry (Background)

```
node-cron job runs on schedule (subscriptionExpiry.job.js)
    │
    ▼
Query: SELECT * FROM user_subscriptions
       WHERE status = 'active' AND end_date < NOW()
    │
    ▼
For each expired record:
    UPDATE user_subscriptions SET status = 'expired'
    │
    ▼
User's next request to watch content:
    ├── verifySubscription middleware finds no active subscription
    └── 403 → Frontend redirects to /pricing
```

---

## Quick Reference

### Key File Locations

| What | Where |
|------|-------|
| Backend entry | `backend/src/server.js` |
| Express app setup | `backend/src/app.js` |
| All routes | `backend/src/api/routes/index.js` |
| Model relationships | `backend/src/models/index.js` |
| Frontend entry | `src/main.tsx` |
| Frontend routing | `src/App.tsx` |
| API client (Axios) | `src/services/` |
| Redux store | `src/store/slices/` |
| Auth context | `src/lib/auth.tsx` |

### Default Ports

| Service | Port |
|---------|------|
| React frontend (dev) | 3000 |
| Express backend | 5000 |
| MySQL | 3306 |

### Admin Credentials

```
URL:      http://localhost:3000/admin
Email:    admin@streamvault.com
Password: Admin@123456
```
