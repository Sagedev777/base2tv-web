# Base2 TV — Monorepo

Welcome to the Base2 TV source code repository. This repository contains the complete stack for the Base2 TV digital platform:

1. **Frontend Web App** (React + Vite)
2. **Backend API Server** (Node.js + Express + MySQL)
3. **Mobile App v1** (React Native + Expo)

## 📁 Repository Structure

- `/src` — The React frontend application.
- `/server` — The Node.js API backend and database logic.
- `/base2tv-mobile` — The React Native mobile application for iOS and Android.

## 🚀 Quick Start Guide

### 1. Web Application (Frontend + Backend)

**Prerequisites:**
- Node.js (v18+)
- MySQL Server

**Setup:**
1. Navigate to the root directory and install dependencies:
   ```bash
   npm install
   ```
2. Navigate to the `/server` directory and install dependencies:
   ```bash
   cd server
   npm install
   ```
3. Create a `.env` file in the `/server` directory and add your MySQL credentials (see `server/.env.example` if available).
4. From the root directory, start both the frontend and backend servers concurrently:
   ```bash
   npm run dev:all
   ```
   The web app will run on `http://localhost:5173` and the API on `http://localhost:5000`.

### 2. Mobile Application

The mobile app is built with [Expo](https://expo.dev/) and React Native.

**Setup:**
1. Navigate to the mobile app directory:
   ```bash
   cd base2tv-mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. Download the **Expo Go** app on your iOS or Android device.
5. Scan the QR code displayed in your terminal to preview the app on your phone.

---

## 🛠 Deployment & Publishing

### Deploying the Web App
1. Build the frontend for production:
   ```bash
   npm run build
   ```
2. The compiled static files will be in the `/dist` directory. Upload these files to your web server (e.g., Apache, Nginx, or cPanel).
3. Upload the `/server` directory to your Node.js hosting environment, run `npm install`, and start `server.js` using a process manager like PM2.

### Publishing the Mobile App
To publish the app to the Apple App Store or Google Play Store, you will use Expo Application Services (EAS).
1. Create an Expo account at [expo.dev](https://expo.dev).
2. Install the EAS CLI: `npm install -g eas-cli`.
3. Log in: `eas login`.
4. Build the app: `eas build --profile production`.

---

© 2026 Base2 TV Uganda. All Rights Reserved.
