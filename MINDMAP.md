# SmokeTab — Project Mind Map

> Digital "buy now, pay later" tab system for small shops (tapris/paan shops)

---

## SmokeTab
- **Type:** Progressive Web App (PWA)
- **Stack:** React + Node.js/Express + MongoDB (Mongoose) + Supabase (Auth)
- **Real-time:** Socket.IO
- **Goal:** Connect vendors & buyers, track tabs, enforce limits, collect payments

---

## 1. User Roles
- **Vendor (Shop Owner)**
  - Manages inventory quick-add grid
  - Adds items to customer tabs
  - Views analytics & outstanding dues
  - Collects UPI payments
- **Buyer (Customer)**
  - Views tab & transaction history
  - Tracks daily/weekly/monthly consumption
  - Sets health/budget limits
  - Pays dues via UPI

---

## 2. Frontend (`client/`)
- **Tech:** React 19, Vite 8, React Router v7, Chart.js, Tailwind
- **PWA:** `vite-plugin-pwa` + Workbox service worker

### Pages
- **Auth**
  - `LoginPage` — OTP phone number login

- **Vendor** (`/vendor/*`)
  - `VendorDashboard` — list of linked customers + dues
  - `CustomerTab` — add/remove items for a specific customer
  - `InventoryManager` — manage quick-add item grid
  - `VendorAnalytics` — total exposure, top debtors chart
  - `VendorQR` — display vendor's unique QR code for linking

- **Buyer** (`/buyer/*`)
  - `BuyerDashboard` — overview of all tabs
  - `TabDetail` — transaction list for one vendor tab
  - `ConsumptionPage` — visual graphs (daily/weekly/monthly)
  - `LimitsPage` — set max cigarettes/day or ₹ limit

- **Common**
  - `ScanPage` — QR code scanner to link buyer ↔ vendor
  - `NotFoundPage` — 404

### Components
- `Layout` — shell with top bar + bottom nav
- `BottomNav` — mobile navigation bar
- `ProtectedRoute` — role-based auth guard
- `TransactionList` — reusable transaction feed
- `ItemGrid` — quick-add grid of items
- `ConsumptionChart` — Chart.js wrapper
- `PaymentModal` — full / partial UPI payment flow
- `LimitWarningModal` — alert when buyer limit is breached
- `QRCodeDisplay` — renders `qrcode.react` QR
- `LoadingSpinner` — full-page / inline spinner

### State & Utilities
- `AuthContext` / `useAuth` — global auth state (Supabase session)
- `useSocket` — real-time Socket.IO hook
- `lib/api.js` — Axios instance pointing at backend
- `lib/socket.js` — Socket.IO client setup
- `lib/supabase.js` — Supabase client
- `lib/helpers.js` — formatting utilities

---

## 3. Backend (`server/`)
- **Tech:** Node.js, Express 5, Mongoose (MongoDB), Socket.IO, JWT, node-cron

### API Routes → Controllers
| Route | Controller | Responsibility |
|-------|-----------|----------------|
| `/api/auth` | `authController` | OTP login, JWT issue, Supabase verify |
| `/api/shops` | `shopController` | Create/get shop, generate QR token |
| `/api/tabs` | `tabController` | Create tab, list tabs, link buyer↔vendor |
| `/api/payments` | `paymentController` | Record full/partial payments |
| `/api/limits` | `limitController` | CRUD buyer daily limits |
| `/api/analytics` | `analyticsController` | Vendor exposure, top debtors |

### Mongoose Models
- `User` — phone, role (vendor/buyer), Supabase UID
- `Shop` — vendor ref, name, UPI ID, QR token, inventory items
- `Tab` — buyer ref, shop ref, running balance, status
- `Transaction` — tab ref, item name, qty, price, timestamp
- `Payment` — tab ref, amount, UPI ref, timestamp
- `Limit` — buyer ref, type (count/amount), value, period (daily)
- `InventoryItem` — shop ref, name, price, display order

### Middleware
- `auth.js` — JWT verification, attach `req.user`
- `errorHandler.js` — centralised error responses

### Real-time (`socket/socketHandler.js`)
- Vendor adds item → emits `transaction:new` to buyer's room
- Payment recorded → emits `payment:confirmed` to vendor's room
- Limit breached → emits `limit:warning` to vendor's room

### Background Jobs (`jobs/whatsappReminder.js`)
- `node-cron` weekly job
- Queries all tabs with outstanding balance
- Sends WhatsApp message via API: *"Hi! Your tab at [Shop] is ₹X. Pay here: [link]"*

### Config
- `config/db.js` — Mongoose connection (MongoDB Atlas / in-memory for dev)
- `config/supabase.js` — Supabase admin client

---

## 4. Data Flow

```
Buyer App  ──── REST/Socket ────►  Express Server  ────►  MongoDB
                                         │
                              Supabase Auth (OTP/JWT)
                                         │
                              node-cron  ────►  WhatsApp API

Vendor adds item:
  VendorDashboard → POST /api/tabs/:id/transactions
    → tabController saves Transaction
    → socket.emit("transaction:new") → BuyerDashboard updates live

Buyer pays:
  PaymentModal → POST /api/payments
    → paymentController saves Payment, updates Tab balance
    → socket.emit("payment:confirmed") → Vendor notified
```

---

## 5. Key Feature: Limit Warning Flow
```
Vendor taps item  →  backend checks buyer's Limit doc
  ├── Within limit  →  transaction saved normally
  └── Limit breached  →  socket emits "limit:warning" to vendor
                            →  LimitWarningModal shown
                                ├── Vendor overrides  →  transaction saved
                                └── Vendor cancels   →  item not added
```

---

## 6. Payment Flow (UPI)
```
Buyer taps "Pay Dues"
  ├── Mobile  →  UPI deep link (upi://pay?...) opens installed UPI apps
  └── Desktop →  QRCodeDisplay shows vendor's static UPI QR
  
After payment:
  →  POST /api/payments  { tabId, amount, upiRef }
  →  Tab balance decremented
  →  Vendor notified via Socket.IO
```

---

## 7. PWA Features
- Service worker (Workbox) caches shell & static assets
- `manifest.webmanifest` — installable to home screen
- Offline-friendly shell; sync resumes when online
- Mobile-first, high-contrast UI for outdoor (sunlight) use

---

## 8. Project Structure
```
money_app/
├── client/               ← React PWA
│   └── src/
│       ├── pages/        ← auth | vendor | buyer | common
│       ├── components/   ← shared UI components
│       ├── contexts/     ← AuthContext
│       ├── hooks/        ← useAuth, useSocket
│       └── lib/          ← api, socket, supabase, helpers
├── server/               ← Express API
│   └── src/
│       ├── routes/       ← 6 route files
│       ├── controllers/  ← 6 controller files
│       ├── models/       ← 7 Mongoose models
│       ├── middleware/   ← auth, errorHandler
│       ├── socket/       ← socketHandler
│       ├── jobs/         ← whatsappReminder (cron)
│       ├── config/       ← db, supabase
│       └── server.js     ← HTTP + Socket.IO init
├── PRD                   ← Product Requirements Document
└── implementation_plan.md
```

---

## 9. Development Timeline (9 Weeks)
| Phase | Weeks | Focus |
|-------|-------|-------|
| 1 — Design | 1–2 | Wireframes, DB schema design |
| 2 — Core Engine | 3–5 | Auth, QR linking, Vendor POS, Buyer Dashboard |
| 3 — Advanced | 6–7 | Limits, UPI payments, Analytics, WhatsApp |
| 4 — Beta Test | 8 | One real tapri, 5–10 customers, bug fixes |
| 5 — Launch | 9 | Production deploy, vendor acquisition |
