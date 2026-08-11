const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const wipeEndpoint = `
  let currentTelegramOtp = null;
  let currentEmailOtp = null;

  app.post("/api/factory-reset/request-telegram", async (req, res) => {
    try {
      currentTelegramOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      if (!botToken || !chatId) {
        console.warn("Telegram not configured. OTP is: " + currentTelegramOtp);
        return res.json({ success: true, message: "Telegram not configured, OTP printed in logs." });
      }
      
      const message = "⚠️ URGENT: Factory Reset Requested.\\nYour Telegram OTP is: " + currentTelegramOtp;
      await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to send Telegram OTP" });
    }
  });

  app.post("/api/factory-reset/request-email", async (req, res) => {
    try {
      currentEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const adminEmail = process.env.VITE_ADMIN_EMAIL || 'admin@example.com';
      
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Email not configured. OTP is: " + currentEmailOtp);
        return res.json({ success: true, message: "Email not configured, OTP printed in logs." });
      }

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: "URGENT: Factory Reset OTP",
        text: "Your Email OTP for Factory Reset is: " + currentEmailOtp
      });
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to send Email OTP" });
    }
  });

  app.post("/api/factory-reset/execute", async (req, res) => {
    try {
      const { telegramOtp, emailOtp, masterPassword } = req.body;
      
      if (!currentTelegramOtp || telegramOtp !== currentTelegramOtp) {
        return res.status(400).json({ error: "Invalid Telegram OTP" });
      }
      if (!currentEmailOtp || emailOtp !== currentEmailOtp) {
        return res.status(400).json({ error: "Invalid Email OTP" });
      }
      if (masterPassword !== process.env.MASTER_WIPE_PASSWORD) {
        return res.status(400).json({ error: "Invalid Master Password" });
      }

      // Clear OTPs
      currentTelegramOtp = null;
      currentEmailOtp = null;

      // 1. Wipe Firestore
      const { initializeApp: initClientApp } = require('firebase/app');
      const { getFirestore, collection, getDocs, deleteDoc, collectionGroup } = require('firebase/firestore');
      
      let firebaseApp;
      try {
        firebaseApp = require('firebase/app').getApp();
      } catch (e) {
        firebaseApp = initClientApp({
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
              if (col === 'schools' && d.id === 'admin9945') continue;
              if (d.data() && d.data().role === 'supreme_admin') continue;
              await deleteDoc(d.ref).catch(()=> {});
          }
      }

      const subCollections = ['principals', 'teachers', 'students', 'admins'];
      for (const col of subCollections) {
          const snap = await getDocs(collectionGroup(db, col));
          for (const d of snap.docs) {
              if (d.data() && d.data().role === 'supreme_admin') continue;
              if (d.id.includes('u_admin')) continue;
              await deleteDoc(d.ref).catch(()=> {});
          }
      }

      // 2. Wipe Firebase Auth Users
      try {
        const { initializeApp: initAdminApp } = require('firebase-admin/app');
        const { getAuth } = require('firebase-admin/auth');
        
        let adminApp;
        try {
           adminApp = require('firebase-admin/app').getApp();
        } catch(e) {
           adminApp = initAdminApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
        }
        
        const auth = getAuth(adminApp);
        let pageToken;
        do {
           const result = await auth.listUsers(1000, pageToken);
           const uidsToDelete = [];
           for (const u of result.users) {
              if (u.uid === 'u_admin' || (u.email && u.email.includes('admin'))) continue;
              uidsToDelete.push(u.uid);
           }
           if (uidsToDelete.length > 0) {
              await auth.deleteUsers(uidsToDelete);
              console.log("Deleted auth users:", uidsToDelete.length);
           }
           pageToken = result.pageToken;
        } while (pageToken);
      } catch (authError) {
        console.error("Firebase Auth Wipe Error:", authError);
      }

      res.json({ success: true, message: "Factory Reset Completed Successfully" });
    } catch (error) {
      console.error("Wipe error:", error);
      res.status(500).json({ error: "Failed to wipe database" });
    }
  });
`;

code = code.replace(/app\.post\("\/api\/wipe-database", async \(req, res\) => \{[\s\S]*?\}\);/, wipeEndpoint);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with multi-step wipe");
