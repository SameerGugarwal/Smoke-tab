# 🚬 SmokeTab

SmokeTab is a digital "buy now, pay later" (tab) system Progressive Web App (PWA) designed specifically for small shops, tapris, and paan vendors, and their regular customers. It eliminates the need for paper ledgers and provides a real-time, transparent platform for tracking daily consumption and dues.

## 🌟 Key Features

### For Vendors (Shop Owners)
- **POS & Quick-Add Ledger:** A customizable grid of common items (cigarettes, chai, gum) for one-tap additions to a customer's tab.
- **Analytics Dashboard:** Track total market exposure, daily sales, and identify top debtors instantly.
- **QR Code Onboarding:** Allow customers to link to your shop instantly by scanning your unique QR code.
- **Automated Collection:** (Coming Soon) Automated weekly WhatsApp reminders sent to customers to clear their dues.
- **UPI Integration:** Save your UPI ID so customers can pay their tabs directly from the app.

### For Buyers (Customers)
- **Real-Time Sync:** See your tab update instantly the moment the vendor adds an item.
- **Consumption Tracking:** Visual charts to track your daily/weekly spending and consumption habits.
- **Health & Budget Limits:** Set a daily limit (e.g., "Max 3 cigarettes/day"). If exceeded, the vendor receives a warning prompt.
- **One-Click Payments:** Pay your outstanding dues directly via installed UPI apps (PhonePe, GPay, Paytm) or by scanning a QR code on desktop.

---

## 🛠️ Tech Stack

**Frontend (Client)**
- React 19 + Vite
- React Router DOM
- Vanilla CSS (Custom Dark-mode Design System)
- `vite-plugin-pwa` for offline capabilities and home-screen installation
- Chart.js (`react-chartjs-2`) for analytics
- Socket.IO-client for real-time updates

**Backend (Server)**
- Node.js + Express.js
- MongoDB Atlas (via Mongoose)
- Socket.IO for real-time bi-directional events
- Twilio WhatsApp API for OTP authentication and reminders
- JSON Web Tokens (JWT) for secure session management

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster URI (or you can use the built-in in-memory fallback for local testing)
- Twilio Account (for WhatsApp OTPs)

### 1. Clone the repository
```bash
git clone https://github.com/SameerGugarwal/Smoke-tab.git
cd Smoke-tab
```

### 2. Setup the Backend
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5001
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173

# Twilio (For WhatsApp OTPs)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=+14155238886
```
Start the server:
```bash
npm run dev
```

### 3. Setup the Frontend
```bash
cd client
npm install
```
Start the frontend development server:
```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

---

## 📱 How to Use (Local Dev)
1. **Join the Twilio Sandbox:** If testing locally with a Twilio Sandbox, ensure you send the "join" message to the Twilio number from your WhatsApp first.
2. **Login:** Enter your phone number on the login screen. Check your WhatsApp (or the backend server console if Twilio is disabled) for the 6-digit OTP.
3. **Roles:** On your first login, select whether you are a **Vendor** or a **Buyer**.
   - If Vendor: Enter your Shop Name to create your dashboard.
   - If Buyer: Click "Scan QR" to scan a vendor's QR code and establish a tab.

---

## 📄 License
This project is proprietary and built for SmokeTab.
