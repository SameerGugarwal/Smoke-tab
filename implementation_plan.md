# SmokeTab — Implementation Plan (v2)

A digital "buy now, pay later" tab system PWA for small shop vendors (tapri/paan shops) and their regular customers.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Vite + React 18 | Fast dev server, excellent DX, PWA plugin support |
| **PWA** | `vite-plugin-pwa` + Workbox | Auto service worker, offline caching, installability |
| **Styling** | Vanilla CSS (custom design system) | High-contrast, mobile-first, icon-heavy per PRD |
| **Routing** | React Router v6 | Client-side routing with role-based guards |
| **Charts** | Chart.js via `react-chartjs-2` | Lightweight consumption/analytics graphs |
| **QR Codes** | `qrcode.react` + `html5-qrcode` | Generate & scan QR codes in-app |
| **Auth** | Supabase Auth | OTP phone authentication |
| **Backend API** | Express.js + Node.js | REST API server connecting to MongoDB |
| **Database** | MongoDB Atlas + Mongoose | Document DB, flexible schema, hosted cluster |
| **Realtime** | Socket.io | Real-time tab sync (replaces Supabase Realtime, which only works with PostgreSQL) |
| **Payments** | UPI deep links + QR fallback | No payment gateway dependency; direct UPI |
| **WhatsApp** | Twilio WhatsApp API (via backend cron) | Automated weekly reminders |
| **Fonts** | Google Fonts (Inter) | Clean, modern typography |

> [!NOTE]
> **Why Express + Socket.io?** Supabase Realtime is built on PostgreSQL's WAL. Since we're using MongoDB, we need Socket.io for real-time tab sync. The Express server also gives us a proper API layer for business logic, limit checks, and payment processing.

---

## Architecture Overview

```mermaid
graph LR
    A[React PWA<br/>Vite] -->|REST API| B[Express.js<br/>Server]
    A -->|Auth| C[Supabase Auth<br/>OTP]
    B -->|Mongoose| D[MongoDB Atlas]
    A <-->|WebSocket| B
    B -->|Twilio API| E[WhatsApp<br/>Reminders]
    B -->|Verify JWT| C
```

**Flow:**
1. User authenticates via **Supabase Auth** (phone OTP) → gets a JWT
2. Frontend sends JWT in `Authorization` header to **Express server**
3. Express verifies the JWT against Supabase → extracts user ID
4. Express performs CRUD on **MongoDB Atlas** via Mongoose
5. Real-time updates pushed to connected clients via **Socket.io**

---

## User Review Required

> [!IMPORTANT]
> **MongoDB Atlas Cluster:** You will need a MongoDB Atlas account + cluster. For development, the free M0 tier works perfectly. You'll provide the connection string (`MONGODB_URI`).

> [!IMPORTANT]
> **Supabase Project:** You still need a Supabase project for phone OTP auth. Create one at [supabase.com](https://supabase.com) and provide the URL + anon key. For initial dev, we'll use mock auth mode.

> [!IMPORTANT]
> **WhatsApp Reminders:** Twilio integration requires account + Meta Business verification. We'll build the endpoint but stub the actual sending until you configure credentials.

> [!WARNING]
> **UPI Payments:** `upi://pay?...` deep links only work on mobile browsers with UPI apps. On desktop, we show a QR code. Vendor manually marks payments as "received" (no server-side verification without a payment gateway).

---

## Database Schema (MongoDB / Mongoose)

```mermaid
erDiagram
    USERS ||--o{ SHOPS : "owns (vendor)"
    USERS ||--o{ TABS : "has (buyer)"
    SHOPS ||--o{ TABS : "has"
    SHOPS ||--o{ INVENTORY_ITEMS : "has"
    TABS ||--o{ TRANSACTIONS : "contains"
    TABS ||--o{ PAYMENTS : "has"
    USERS ||--o{ LIMITS : "configures"

    USERS {
        ObjectId _id PK
        string supabaseId "from Supabase Auth"
        string phone
        string name
        string role "vendor | buyer"
        string avatarUrl
        Date createdAt
    }

    SHOPS {
        ObjectId _id PK
        ObjectId vendorId FK
        string name
        string upiId
        string qrToken "unique token for QR linking"
        Date createdAt
    }

    INVENTORY_ITEMS {
        ObjectId _id PK
        ObjectId shopId FK
        string name "e.g. Classic Milds"
        string icon "emoji or icon key"
        number price "in paise"
        string category "cigarette | chai | gum | other"
        number sortOrder
        boolean isActive
    }

    TABS {
        ObjectId _id PK
        ObjectId shopId FK
        ObjectId buyerId FK
        number balanceDue "in paise, running total"
        Date createdAt
        Date updatedAt
    }

    TRANSACTIONS {
        ObjectId _id PK
        ObjectId tabId FK
        ObjectId itemId FK "nullable for manual entries"
        string itemName
        number quantity
        number amount "in paise"
        string addedBy "vendor"
        boolean limitOverridden
        Date createdAt
    }

    PAYMENTS {
        ObjectId _id PK
        ObjectId tabId FK
        number amount "in paise"
        string method "upi | cash | other"
        string status "pending | confirmed"
        string upiRef "optional"
        Date createdAt
    }

    LIMITS {
        ObjectId _id PK
        ObjectId userId FK
        string limitType "daily_count | daily_amount"
        number limitValue "count or paise"
        string itemCategory "cigarette | all"
        boolean isActive
        Date createdAt
    }
```

---

## Project File Structure

```
money_app/
├── client/                            # React PWA (Vite)
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── pwa-192x192.png
│   │   └── pwa-512x512.png
│   ├── src/
│   │   ├── main.jsx                   # App entry point
│   │   ├── App.jsx                    # Router + layout
│   │   ├── index.css                  # Global design system
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase.js            # Supabase Auth client
│   │   │   ├── api.js                 # Axios instance (points to Express)
│   │   │   ├── socket.js              # Socket.io client
│   │   │   └── helpers.js             # Utility functions
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx        # Auth state provider
│   │   │
│   │   ├── components/
│   │   │   ├── Layout.jsx             # App shell (header + bottom nav)
│   │   │   ├── BottomNav.jsx          # Mobile bottom navigation
│   │   │   ├── ProtectedRoute.jsx     # Auth + role guard
│   │   │   ├── QRCodeDisplay.jsx      # Show vendor QR
│   │   │   ├── QRCodeScanner.jsx      # Scan QR to link
│   │   │   ├── ItemGrid.jsx           # Quick-add inventory grid
│   │   │   ├── TransactionList.jsx    # Scrollable transaction list
│   │   │   ├── ConsumptionChart.jsx   # Chart.js graphs
│   │   │   ├── LimitWarningModal.jsx  # "Limit reached!" popup
│   │   │   ├── PaymentModal.jsx       # UPI pay / QR display
│   │   │   └── LoadingSpinner.jsx     # Loading state
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx      # Phone + OTP
│   │   │   │   └── RoleSelectPage.jsx # Vendor or Buyer
│   │   │   │
│   │   │   ├── vendor/
│   │   │   │   ├── VendorDashboard.jsx
│   │   │   │   ├── CustomerTab.jsx    # Individual customer ledger + POS
│   │   │   │   ├── InventoryManager.jsx
│   │   │   │   ├── VendorAnalytics.jsx
│   │   │   │   └── VendorQR.jsx
│   │   │   │
│   │   │   ├── buyer/
│   │   │   │   ├── BuyerDashboard.jsx
│   │   │   │   ├── TabDetail.jsx
│   │   │   │   ├── ConsumptionPage.jsx
│   │   │   │   └── LimitsPage.jsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── ScanPage.jsx
│   │   │       └── NotFoundPage.jsx
│   │   │
│   │   └── hooks/
│   │       ├── useAuth.js
│   │       ├── useSocket.js           # Socket.io realtime hook
│   │       └── useConsumptionData.js
│   │
│   ├── index.html
│   └── vite.config.js
│
├── server/                            # Express.js Backend
│   ├── src/
│   │   ├── app.js                     # Express app setup + middleware
│   │   ├── server.js                  # HTTP + Socket.io server start
│   │   │
│   │   ├── config/
│   │   │   ├── db.js                  # MongoDB Atlas connection (Mongoose)
│   │   │   └── supabase.js            # Supabase admin client (JWT verify)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                # Verify Supabase JWT → attach user
│   │   │   └── errorHandler.js        # Global error handling
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Shop.js
│   │   │   ├── InventoryItem.js
│   │   │   ├── Tab.js
│   │   │   ├── Transaction.js
│   │   │   ├── Payment.js
│   │   │   └── Limit.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js          # POST /api/auth/register (role select)
│   │   │   ├── shopRoutes.js          # CRUD shops + inventory
│   │   │   ├── tabRoutes.js           # Tab management + transactions
│   │   │   ├── paymentRoutes.js       # Record payments
│   │   │   ├── limitRoutes.js         # CRUD limits
│   │   │   └── analyticsRoutes.js     # Vendor analytics queries
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── shopController.js
│   │   │   ├── tabController.js
│   │   │   ├── paymentController.js
│   │   │   ├── limitController.js
│   │   │   └── analyticsController.js
│   │   │
│   │   ├── socket/
│   │   │   └── socketHandler.js       # Socket.io event handlers (tab updates)
│   │   │
│   │   └── jobs/
│   │       └── whatsappReminder.js    # Cron job: weekly WhatsApp reminders
│   │
│   ├── package.json
│   └── .env                           # MONGODB_URI, SUPABASE_URL, SUPABASE_SERVICE_KEY, TWILIO_*
│
├── .gitignore
└── README.md
```

---

## Proposed Changes — Phased Build

### Phase 1: Project Bootstrap & Design System

#### [NEW] Client — Vite + React setup
- Init with `npx create-vite@latest ./client --template react`
- Install deps: `react-router-dom`, `@supabase/supabase-js`, `qrcode.react`, `html5-qrcode`, `react-chartjs-2`, `chart.js`, `vite-plugin-pwa`, `axios`, `socket.io-client`

#### [NEW] Server — Express setup
- Init with `npm init -y` in `/server`
- Install deps: `express`, `mongoose`, `cors`, `dotenv`, `socket.io`, `@supabase/supabase-js`, `node-cron`, `helmet`, `morgan`
- Dev deps: `nodemon`

#### [NEW] [index.css](file:///Users/sameerchoudhary/Desktop/money_app/client/src/index.css)
- Full design system: CSS custom properties for colors, spacing, typography
- High-contrast dark theme (outdoor visibility)
- Glassmorphism card styles, button grid, animations

#### [NEW] [vite.config.js](file:///Users/sameerchoudhary/Desktop/money_app/client/vite.config.js)
- React plugin + PWA plugin with manifest
- Proxy `/api` to Express server during dev

---

### Phase 2: Backend Foundation

#### [NEW] [db.js](file:///Users/sameerchoudhary/Desktop/money_app/server/src/config/db.js)
- Mongoose connection to MongoDB Atlas
- Connection error handling + retry logic

#### [NEW] [supabase.js](file:///Users/sameerchoudhary/Desktop/money_app/server/src/config/supabase.js)
- Supabase admin client (service role key) for JWT verification

#### [NEW] [auth.js middleware](file:///Users/sameerchoudhary/Desktop/money_app/server/src/middleware/auth.js)
- Extract Bearer token from Authorization header
- Verify via `supabase.auth.getUser(token)`
- Attach user info to `req.user`

#### [NEW] All Mongoose Models
- `User`, `Shop`, `InventoryItem`, `Tab`, `Transaction`, `Payment`, `Limit`
- Schema validation, indexes on foreign keys, timestamps

#### [NEW] [app.js](file:///Users/sameerchoudhary/Desktop/money_app/server/src/app.js) + [server.js](file:///Users/sameerchoudhary/Desktop/money_app/server/src/server.js)
- Express app with CORS, helmet, JSON parsing, morgan logging
- Socket.io attached to HTTP server
- Route mounting

---

### Phase 3: Auth & App Shell (Frontend)

#### [NEW] [supabase.js](file:///Users/sameerchoudhary/Desktop/money_app/client/src/lib/supabase.js)
- Supabase client init from env vars (auth only)

#### [NEW] [api.js](file:///Users/sameerchoudhary/Desktop/money_app/client/src/lib/api.js)
- Axios instance with base URL + auth interceptor (attaches Supabase JWT)

#### [NEW] [socket.js](file:///Users/sameerchoudhary/Desktop/money_app/client/src/lib/socket.js)
- Socket.io client, connects with auth token

#### [NEW] [AuthContext.jsx](file:///Users/sameerchoudhary/Desktop/money_app/client/src/contexts/AuthContext.jsx)
- `signInWithOtp`, `verifyOtp`, `signOut`
- Fetches user profile from Express `/api/auth/me`
- Stores role + profile in context

#### [NEW] Auth Pages — `LoginPage.jsx`, `RoleSelectPage.jsx`
#### [NEW] App Shell — `Layout.jsx`, `BottomNav.jsx`, `ProtectedRoute.jsx`

---

### Phase 4: Vendor POS & Ledger

#### [NEW] API Routes + Controllers
- `POST /api/shops` — create shop
- `GET/PUT /api/shops/:id/inventory` — manage items
- `POST /api/tabs/:tabId/transactions` — add item (with limit check)
- `DELETE /api/tabs/:tabId/transactions/:txId` — remove entry

#### [NEW] Socket Events
- `tab:item-added` — broadcast to buyer when vendor adds item
- `tab:item-removed` — broadcast on deletion
- `tab:payment-received` — broadcast on payment confirmation

#### [NEW] Frontend Pages
- `VendorDashboard.jsx` — customer list + balances
- `CustomerTab.jsx` — POS with ItemGrid + transaction list
- `InventoryManager.jsx` — manage quick-add items
- `ItemGrid.jsx` — tappable button grid component
- `LimitWarningModal.jsx` — override prompt

---

### Phase 5: Buyer Dashboard & Tracking

#### [NEW] API Routes
- `GET /api/tabs` — buyer's tabs with vendors
- `GET /api/tabs/:id/consumption` — aggregated stats
- `POST /api/limits` — set daily limits
- `GET /api/limits` — get active limits

#### [NEW] Frontend Pages
- `BuyerDashboard.jsx` — vendor list + balances
- `TabDetail.jsx` — real-time transaction list (Socket.io)
- `ConsumptionPage.jsx` — charts + trends
- `LimitsPage.jsx` — set/toggle limits
- `ConsumptionChart.jsx` — Chart.js wrapper

---

### Phase 6: QR Linking, Payments, Analytics, WhatsApp

#### [NEW] QR System
- `POST /api/tabs/link` — create tab from QR scan (validates token)
- `QRCodeDisplay.jsx` — render vendor QR
- `QRCodeScanner.jsx` — camera scan + API call

#### [NEW] Payments
- `POST /api/payments` — record payment (full/partial)
- `PUT /api/payments/:id/confirm` — vendor confirms receipt
- `PaymentModal.jsx` — UPI deep link (mobile) or QR (desktop)

#### [NEW] Analytics
- `GET /api/analytics/exposure` — total outstanding
- `GET /api/analytics/top-debtors` — sorted debtor list
- `VendorAnalytics.jsx` — charts + stats

#### [NEW] WhatsApp Cron
- `whatsappReminder.js` — node-cron weekly job
- Queries all tabs with balance > 0, sends Twilio message
- Stub until credentials configured

---

## Design System Highlights

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#0a0a0f` | Main background (deep dark) |
| `--color-surface` | `#1a1a2e` | Cards, modals |
| `--color-primary` | `#00d4aa` | Primary actions, accents (mint green) |
| `--color-danger` | `#ff4757` | Warnings, overdue amounts |
| `--color-warning` | `#ffa502` | Limit alerts |
| `--color-text` | `#e8e8e8` | Primary text (high contrast) |
| `--radius` | `16px` | Rounded corners |
| `--font` | `'Inter', sans-serif` | Clean typography |

- Dark theme for outdoor/sunlight readability
- Large tap targets (min 48px)
- Glassmorphism cards with blur + border
- Smooth page transitions + micro-animations

---

## Feature Plan: Camera QR Scanner

### Goal Description
Implement an in-app camera scanner on the `ScanPage` allowing buyers to directly scan a vendor's QR code without leaving the app. This creates a seamless "connect to vendor" experience.

### Proposed Changes

#### [NEW] client/src/components/QRCodeScanner.jsx
- Create a React wrapper around the `html5-qrcode` library.
- It will render a `<div id="qr-reader"></div>`.
- On mount, it initializes `Html5QrcodeScanner` to request camera permissions and start scanning.
- On successful scan, it extracts the `token` from the scanned URL (which looks like `https://domain/scan?token=abc`) and calls an `onScan(token)` prop.
- On unmount, it properly cleans up and stops the camera to prevent memory leaks and the camera light staying on.

#### [MODIFY] client/src/pages/common/ScanPage.jsx
- Import and render the new `<QRCodeScanner />` component below the header.
- Keep the manual token input as a fallback.
- When the scanner triggers the `onScan(token)` callback, immediately invoke the existing `linkShop(token)` function.

### User Review Required
> [!IMPORTANT]
> **Camera Permissions:** The browser will prompt the user for camera permissions the first time they open this page. If they deny it, the manual token entry will serve as a fallback. 
> Does this sound good to you?

---

## Feature Plan: Vendor Payment Confirmation Flow

### Goal Description
When a buyer clicks "Pay Now" and records a payment, the vendor needs to be notified in real-time and provided with a UI to "Confirm Receipt" so the tab balance is actually cleared. Currently, the buyer's action creates a `pending` payment, but the vendor has no way to see or approve it.

### Proposed Changes

#### [MODIFY] server/src/controllers/paymentController.js
- In `recordPayment`, emit a Socket.io event (`tab:payment-initiated`) to the vendor after creating the pending payment in the database.

#### [MODIFY] client/src/pages/vendor/CustomerTab.jsx
- **State**: Add a `pendingPayments` state to keep track of payments waiting for confirmation.
- **Data Loading**: On component mount, fetch all payments for this tab (`GET /api/payments/tab/:tabId`) and filter for those with `status === 'pending'`.
- **Real-time Updates**: Add a `useSocket` listener for `tab:payment-initiated` to instantly display incoming payments without the vendor needing to refresh.
- **UI**: Add a new "Pending Payments" section (above the Quick Add grid) showing the amount and a bright "Confirm Receipt" button for each pending payment.
- **Action**: When the vendor clicks "Confirm Receipt", it will call `PUT /api/payments/:paymentId/confirm`. This will update the tab balance and the existing socket logic will immediately update the UI.

### User Review Required
> [!IMPORTANT]
> This flow requires the vendor to manually click "Confirm Receipt" before the buyer's balance goes down. This is the safest approach since we don't have a payment gateway verifying the UPI transfer automatically.
> Do you approve this plan?

---

## Feature Plan: Payments & Receipts History

### Goal Description
Add dedicated "Payments" pages for both Buyers and Vendors. Vendors should be able to see a history of all payments they've received across all customers. Buyers should be able to see a history of all payments they've made across all shops. Clicking on any payment should open a digital "Receipt/Bill" view.

### Proposed Changes

#### [MODIFY] server/src/controllers/paymentController.js & routes
- **New API `GET /api/payments/vendor`**: Finds all tabs belonging to the vendor's shop, then fetches all payments associated with those tabs, populated with the buyer's details.
- **New API `GET /api/payments/buyer`**: Finds all tabs belonging to the buyer, then fetches all payments associated with those tabs, populated with the shop's details.

#### [NEW] client/src/components/ReceiptModal.jsx
- Create a reusable modal component styled like a printed digital receipt/bill showing:
  - Amount Paid
  - Date & Time
  - Status (Pending/Confirmed)
  - Parties involved (Shop Name & Buyer Name)
  - Transaction ID / UPI Ref

#### [NEW] client/src/pages/vendor/VendorPayments.jsx
- A dedicated page fetching from `/api/payments/vendor`.
- Displays a chronological list of payments received.
- Clicking a payment opens the `ReceiptModal`.

#### [NEW] client/src/pages/buyer/BuyerPayments.jsx
- A dedicated page fetching from `/api/payments/buyer`.
- Displays a chronological list of payments made.
- Clicking a payment opens the `ReceiptModal`.

#### [MODIFY] client/src/App.jsx & client/src/components/BottomNav.jsx
- Register routing for `/vendor/payments` and `/buyer/payments`.
- Add a new "Payments" icon/link (e.g., 💳) to the `BottomNav` for both vendor and buyer roles.

### User Review Required
> [!IMPORTANT]
> - Do you want the new "Payments" page to be accessible from the bottom navigation bar for quick access? I've proposed adding it there.
> - Do you approve this plan?

---

## Feature Plan: UI/UX Vibrant Design Overhaul

### Goal Description
The current UI is a bit dark and uses generic system emojis and basic colors. We will completely overhaul the design to look extremely premium, vibrant, and engaging. This involves switching to a deep-space dark mode with a highly vibrant Neon Cyan/Purple gradient primary theme, upgrading to a beautiful premium font (`Outfit`), and replacing all emojis with sleek, professional SVG icons from `lucide-react`.

### Proposed Changes

#### [MODIFY] client/package.json
- Install `lucide-react` for premium SVG iconography.

#### [MODIFY] client/index.html
- Import the `Outfit` Google Font.

#### [MODIFY] client/src/index.css
- **Color Palette Overhaul**: Change the background to a rich `Deep Space Navy (#0b0914)` and the primary color to a glowing `Neon Cyan (#00f2fe)` paired with `Electric Blue (#4facfe)` gradients.
- **Typography**: Set `--font: 'Outfit', sans-serif;` globally.
- **Glassmorphism & Micro-animations**: Improve the `.card`, `.btn`, and `BottomNav` with stronger glassmorphism (blurs), gradient borders, and bouncy hover scaling effects.
- **Glowing Elements**: Add prominent glow effects to primary buttons and active navigation links.

#### [MODIFY] client/src/components/BottomNav.jsx
- Replace all text emojis (🏠, 💳, 🏪, etc.) with matching SVG icons from `lucide-react` (e.g., `<Home />`, `<CreditCard />`, `<Store />`, `<Scan />`).
- Update the active state styling to use the new glowing vibrant color.

#### [MODIFY] Other Components & Pages
- Replace stray emojis across the app (like the ✅ and ⏳ in `ReceiptModal`, the 👤 in profile pages, and category icons in `InventoryManager` and `ItemGrid`) with `lucide-react` icons to ensure the entire app feels cohesive and professional.

### User Review Required
> [!IMPORTANT]
> - Do you approve this transition to a highly vibrant Neon/Cyberpunk-inspired dark theme with premium `Outfit` typography and `lucide-react` icons?

---

## Open Questions

> [!IMPORTANT]
> **Mock Mode for Development?** I'll build the full UI with mock data first so you can see and interact with everything locally without needing Supabase/MongoDB credentials immediately. We wire up the real backend once you set up your accounts. Does this work?

> [!IMPORTANT]
> **Shop Name & UPI ID:** Collected during vendor onboarding (role selection), or via a separate settings page?

---

## Verification Plan

### Automated Tests
- `npm run build` (client) — verify production build succeeds
- `node server/src/server.js` — verify server starts & connects to mock DB
- Lighthouse PWA audit on built client

### Manual Verification
1. **Auth flow**: Login → OTP → Role select → Dashboard
2. **Vendor POS**: Add items → see balance update → edit/delete
3. **QR Linking**: Generate QR → scan → verify tab created
4. **Buyer sync**: Vendor adds item → buyer sees it in real-time (Socket.io)
5. **Limits**: Set limit → exceed → verify warning modal
6. **Payments**: "Pay Dues" → UPI deep link (mobile) or QR (desktop)
7. **Analytics**: Totals, top debtors, charts
8. **PWA**: Install to home screen, offline shell loads
