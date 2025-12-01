const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Support two ways to provide credentials:
// 1) A JSON file placed at config/firebase-service-account.json (gitignored)
// 2) Environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)

let serviceAccount = null;
const possiblePath = path.resolve(__dirname, "firebase-service-account.json");
if (fs.existsSync(possiblePath)) {
  serviceAccount = require(possiblePath);
} else if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Replace escaped newlines with real newlines if provided via env
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
} else {
  console.warn(
    "No Firebase service account found. Firebase Admin features will fail until credentials are provided."
  );
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth ? admin.auth() : null;
const db = admin.firestore ? admin.firestore() : null;

module.exports = { admin, auth, db };
