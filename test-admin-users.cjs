const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

try {
  const app = initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID
  });
  getAuth(app).listUsers(10).then((list) => {
    console.log("Users:", list.users.map(u => u.email));
  }).catch(e => {
    console.error("List users failed:", e);
  });
} catch(e) {
  console.error("Failed:", e);
}
