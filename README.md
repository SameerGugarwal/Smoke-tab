# 🚬 SmokeTab

> **The digital "buy now, pay later" (tab) system for small shops, tapris, paan vendors, and their regular customers.**

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-latest-purple.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-RealTime-black.svg)](https://socket.io/)

SmokeTab eliminates the need for paper ledgers, providing a real-time, transparent platform for tracking daily consumption and managing dues. Designed as a Progressive Web App (PWA) with a mobile-first, high-contrast dark mode interface for outdoor visibility.

---

## 🌟 Key Features

### 🏪 For Vendors (Shop Owners)
- **POS & Quick-Add Ledger:** A customizable grid of common items (cigarettes, chai, gum) for one-tap additions to a customer's tab.
- **Analytics Dashboard:** Track total market exposure, daily sales, and identify top debtors instantly.
- **QR Code Onboarding:** Allow customers to link to your shop instantly by scanning your unique QR code.
- **Automated Collection:** Automated weekly WhatsApp reminders sent to customers to clear their dues via Twilio.
- **UPI Integration:** Save your UPI ID so customers can pay their tabs directly from the app.

### 👤 For Buyers (Customers)
- **Real-Time Sync:** See your tab update instantly the moment the vendor adds an item.
- **Consumption Tracking:** Visual charts to track your daily/weekly spending and consumption habits.
- **Health & Budget Limits:** Set a daily limit (e.g., "Max 3 cigarettes/day" or "Max ₹100/day"). If exceeded, the vendor receives a warning prompt.
- **One-Click Payments:** Pay your outstanding dues directly via installed UPI apps (PhonePe, GPay, Paytm) or by scanning a QR code on desktop. Partial payments are supported!

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** React 19 + Vite
- **Routing:** React Router DOM v7
- **Styling:** Vanilla CSS (Custom Dark-mode Design System)
- **PWA:** `vite-plugin-pwa` for offline capabilities and home-screen installation
- **Data Viz:** Chart.js (`react-chartjs-2`) for analytics
- **Real-time:** Socket.IO-client

### Backend (Server)
- **Runtime & Framework:** Node.js + Express.js
- **Database:** MongoDB Atlas (via Mongoose)
- **Real-time:** Socket.IO for bi-directional events
- **Authentication:** JSON Web Tokens (JWT) & Twilio WhatsApp API for OTPs

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster URI (or local MongoDB)
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
1. **Join the Twilio Sandbox:** If testing locally with a Twilio Sandbox, ensure you send the "join <sandbox-word>" message to the Twilio number from your WhatsApp first.
2. **Login:** Enter your phone number on the login screen. Check your WhatsApp (or the backend server console if Twilio is bypassed) for the 6-digit OTP.
3. **Roles:** On your first login, select whether you are a **Vendor** or a **Buyer**.
   - **If Vendor:** Enter your Shop Name to create your dashboard.
   - **If Buyer:** Click "Scan QR" to scan a vendor's QR code and establish a tab.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License
This project is proprietary and built for SmokeTab.
