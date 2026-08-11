const admin = require('firebase-admin');
try {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID
  });
  console.log("Admin init success");
} catch(e) {
  console.error("Admin init failed:", e);
}
