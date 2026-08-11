const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `app.get("/api/health", (req, res) => {`;

const wipeRoute = `
  app.post("/api/wipe-database", async (req, res) => {
    try {
      // WARNING: In production, ensure this is protected by authentication!
      const { initializeApp } = require('firebase/app');
      const { getFirestore, collection, getDocs, deleteDoc, collectionGroup } = require('firebase/firestore');
      
      // Prevent initializing twice
      let firebaseApp;
      try {
        firebaseApp = require('firebase/app').getApp();
      } catch (e) {
        firebaseApp = initializeApp({
          apiKey: process.env.VITE_FIREBASE_API_KEY,
          authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.VITE_FIREBASE_APP_ID
        });
      }
      
      const db = getFirestore(firebaseApp);
      
      const topLevel = ['announcements', 'assignments', 'messages', 'payments', 'students', 'schools', 'users'];
      for (const col of topLevel) {
          const snap = await getDocs(collection(db, col));
          for (const d of snap.docs) {
              if (col === 'users' && d.id === 'u_admin') continue;
              if (d.data() && d.data().role === 'supreme_admin') continue;
              await deleteDoc(d.ref);
          }
      }

      const subCollections = ['principals', 'teachers', 'students', 'admins'];
      for (const col of subCollections) {
          const snap = await getDocs(collectionGroup(db, col));
          for (const d of snap.docs) {
              if (d.data() && d.data().role === 'supreme_admin') continue;
              if (d.id.includes('u_admin')) continue;
              await deleteDoc(d.ref);
          }
      }

      res.json({ success: true, message: "Database wiped successfully" });
    } catch (error) {
      console.error("Wipe error:", error);
      res.status(500).json({ error: "Failed to wipe database" });
    }
  });

  app.get("/api/health", (req, res) => {`;

code = code.replace(target, wipeRoute);
fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with wipe route");
