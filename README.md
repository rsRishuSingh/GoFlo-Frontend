# GoFlo App - Frontend

Welcome to the frontend documentation for the Ride Hailing & Emergency Response application. This is a responsive, real-time web application built with **React** and **Vite**, designed to provide seamless ride-booking services for Passengers and Captains, while also offering critical emergency assistance through integrated medic network.

## 🚀 Deployment

The frontend is deployed at:
(https://goflo.netlify.app/)

---

## 🛠️ Tech Stack

- **Framework**: [React](https://react.dev/) (v19)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Maps**: [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api)
- **State Management**: React Context API
- **Routing**: React Router DOM (v7)
- **Real-time Communication**: Socket.io Client
- **Push Notifications**: Firebase Cloud Messaging
- **Animations**: GSAP (GreenSock Animation Platform)
- **HTTP Client**: Axios

---

## 📋 Prerequisites

Ensure you have the following installed:

1.  **Node.js** (v14 or higher)
2.  **Google Maps API Key** (Enabled for Maps JavaScript API, Places API, Directions API)
3.  **Firebase Project** (For push notifications - Service Account Key and Web App Config)

---

## ⚙️ Installation & Setup

1.  **Navigate to the frontend directory**:
    ```bash
    cd Frontend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Configuration**:
    Create a `.env` file in the `Frontend` root directory (same level as `package.json`):

    ```env
    VITE_BASE_URL=http://localhost:5000 (Or your backend URL)
    VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Start the Development Server**:
    ```bash
    npm run dev
    ```
    The app will run at `http://localhost:5173/` by default.

---

## 📱 Application Structure

The application is divided into two main flows: **User (Passenger)** and **Captain (Driver)**.

### 📂 Key Directories

- **`src/pages`**: Main application views (Login, Signup, Home, Riding, etc.).
- **`src/components`**: Reusable UI components (HelpButton, HelpRequestModal, HelpAcceptancePanel, etc.).
- **`src/context`**: Global state management (UserContext, CaptainContext).
- **`src/services`**: API services (helpService, firebaseService, etc.).
- **`src/assets`**: Static assets (images, icons).

### 🚦 Routes

#### Public Routes

- `/` - **Start Screen**: Landing page to choose User or Captain flow.
- `/user-login` - Passenger Login.
- `/user-signup` - Passenger Registration.
- `/captain-login` - Captain Login.
- `/captain-signup` - Captain Registration.

#### Protected User Routes (Requires User Auth)

- `/user-home` - **Dashboard**: Book rides, view map, search locations.
- `/user-riding` - **Live Ride**: Track active ride status.
- `/user-logout` - Log out session.

#### Protected Captain Routes (Requires Captain Auth)

- `/captain-home` - **Dashboard**: Receive and accept ride requests.
- `/captain-riding` - **Live Ride**: Navigation and ride management.
- `/captain-logout` - Log out session.

---

## ✨ Key Features

### 🗺️ Maps & Geolocation

- **Interactive Maps**: Powered by Google Maps API to visualize routes and locations.
- **Autocomplete**: Location search for pickup and destination.
- **Live Tracking**: Real-time vehicle location updates during rides.

### 🔄 Real-Time Functionality

- **Socket.io Integration**:
  - **Ride Requests**: Captains receive instant alerts for nearby rides.
  - **Status Updates**: Users see "Driver Accepted", "Arrived", "Started", and "Completed" statuses instantly.
  - **Live Chat/Notifications**: (If implemented) Instant feedback loops.

### 🛡️ Authentication & Security

- **JWT Handling**: Secure token storage and protected routes.
- **Wrappers**: `UserProtectWrapper` and `CaptainProtectWrapper` ensure unauthorized access is blocked.

### 🆘 Emergency Help System

- **Help Requests**: Users can send emergency help requests with optional descriptions to nearby medics.
- **Medic Network**: Registered users can opt-in as medics to provide assistance.
- **Real-Time Broadcasting**: Help requests are broadcasted via Socket.io to nearby available medics.
- **Push Notifications**: Medics receive instant push notifications for nearby help requests using Firebase Cloud Messaging.
- **Help Acceptance**: Medics can accept help requests and provide real-time assistance.
- **Location-Based Matching**: System finds medics within a 2km radius using geospatial queries.
- **Request Management**: Users can complete or cancel help requests, with real-time status updates.

### 🎨 UI/UX

- **Responsive Design**: Mobile-first approach using Tailwind CSS.
- **Smooth Animations**: GSAP animations for panels, transitions, and ride states.

---

## 📦 Build for Production

To create an optimized production build:

```bash
npm run build
```

This generates the `dist` folder, which can be deployed to platforms like Netlify, Vercel, or AWS.
