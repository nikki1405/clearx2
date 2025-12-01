// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Firebase configuration - Using environment variables for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app only when essential config is present
let app = null;
let analytics = null;
const firebaseConfigured = Boolean(
  firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.appId
);

if (!firebaseConfigured) {
  console.warn(
    "Firebase not configured: missing VITE_FIREBASE_* env vars. Firebase features will be disabled."
  );
} else {
  try {
    app = initializeApp(firebaseConfig);
    // Analytics will be initialized lazily on first use to avoid build-time issues
  } catch (err) {
    console.error("Failed to initialize Firebase app:", err?.message || err);
    app = null;
  }
}

// Lazy-load analytics on first use (avoids top-level await in build)
async function initializeAnalytics() {
  if (analytics || !app || !firebaseConfig.measurementId) {
    return analytics;
  }
  try {
    const { getAnalytics } = await import("firebase/analytics");
    analytics = getAnalytics(app);
    return analytics;
  } catch (err) {
    console.warn(
      "Firebase analytics failed to initialize:",
      err?.message || err
    );
    return null;
  }
}

export { app, firebaseConfigured, initializeAnalytics };
