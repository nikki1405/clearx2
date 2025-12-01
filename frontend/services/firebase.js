// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Analytics is optional and only works in browser environments
let getAnalytics;
try {
  // dynamic import to avoid SSR/build-time issues
  // eslint-disable-next-line import/no-extraneous-dependencies
  getAnalytics = (await import("firebase/analytics")).getAnalytics;
} catch (e) {
  // no-op: analytics may not be available in some build environments
  getAnalytics = null;
}

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

// Helpful runtime validation for missing envs (gives clearer logs in Vercel)
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
    if (
      getAnalytics &&
      typeof window !== "undefined" &&
      firebaseConfig.measurementId
    ) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn(
          "Firebase analytics failed to initialize:",
          err?.message || err
        );
      }
    }
  } catch (err) {
    console.error("Failed to initialize Firebase app:", err?.message || err);
    app = null;
    analytics = null;
  }
}

export { app, analytics, firebaseConfigured };
