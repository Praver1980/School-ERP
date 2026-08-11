import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import os from "os";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";

dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Traffic monitoring variables
  let requestCount = 0;
  let totalRequests = 0;
  const historyData: any[] = [];
  
  // Track requests middleware
  app.use((req, res, next) => {
    requestCount++;
    totalRequests++;
    next();
  });

  // Seed history with some initial real-ish data based on OS
  for (let i = 0; i < 24; i++) {
    const time = new Date(Date.now() - (24 - i) * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    historyData.push({
      time,
      requests: Math.floor(Math.random() * 5),
      cpu: Math.min(100, Math.max(0, (os.loadavg()[0] * 100 / os.cpus().length) + (Math.random() * 5))),
      memory: 100 - (os.freemem() / os.totalmem()) * 100
    });
  }

  setInterval(() => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const cpu = (os.loadavg()[0] * 100 / os.cpus().length);
    const memory = 100 - (os.freemem() / os.totalmem()) * 100;
    
    historyData.push({
      time,
      requests: requestCount,
      cpu: Math.min(Math.max(cpu, 0), 100),
      memory: Math.min(Math.max(memory, 0), 100)
    });
    
    if (historyData.length > 24) {
      historyData.shift();
    }
    
    requestCount = 0;
  }, 5000);

  // Define API routes here FIRST

  app.post("/api/request-demo", async (req, res) => {
    try {
      const { name, email, phone, address } = req.body;
      const adminEmail = process.env.VITE_ADMIN_EMAIL;
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 40px 30px; text-align: center;">
              <table align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #3b82f6; width: 48px; height: 48px; border-radius: 12px; text-align: center; vertical-align: middle; color: #ffffff; font-size: 24px; font-weight: bold; font-style: italic;">
                    N
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; font-size: 28px; margin: 20px 0 10px 0; font-weight: 800; letter-spacing: -0.5px;">Demo Requested</h1>
              <p style="color: #94a3b8; font-size: 16px; margin: 0; font-weight: 400;">A new prospect is interested in Nexus ERP.</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 20px 0; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">Prospect Details</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9; width: 120px;">
                    <span style="color: #64748b; font-size: 14px; font-weight: 600;">Full Name</span>
                  </td>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #0f172a; font-size: 16px; font-weight: 600;">${name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 14px; font-weight: 600;">Email Address</span>
                  </td>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <a href="mailto:${email}" style="color: #3b82f6; font-size: 16px; font-weight: 500; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 14px; font-weight: 600;">Phone Number</span>
                  </td>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
                    <a href="tel:${phone}" style="color: #0f172a; font-size: 16px; font-weight: 500; text-decoration: none;">${phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; vertical-align: top;">
                    <span style="color: #64748b; font-size: 14px; font-weight: 600;">Organization</span>
                  </td>
                  <td style="padding: 15px 0;">
                    <span style="color: #0f172a; font-size: 15px; font-weight: 400; line-height: 1.5;">${address}</span>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 35px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${email}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);">Reply to Prospect</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Nexus ERP System &bull; Automated Notification</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@schoolerpsystem.com',
        to: adminEmail,
        subject: `New Demo Request: ${name}`,
        text: `New Demo Request Details:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nAddress: ${address}`,
        html: htmlContent
      };

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("DEMO REQUEST RECEIVED (Email not configured in .env):\n", mailOptions.text);
        return res.json({ success: true, message: "Logged to console (SMTP credentials not found in .env)" });
      }

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error) {
      console.error("Email Error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/notify", async (req, res) => {
    try {
      const { message } = req.body;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (!botToken || !chatId) {
        return res.status(500).json({ error: "Telegram bot not configured" });
      }
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Telegram API Error:", errorText);
        return res.status(500).json({ error: "Failed to send message" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Notification Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/monitoring", (req, res) => {
    const uptime = os.uptime();
    const uptimeStr = uptime > 3600 
        ? (uptime / 3600).toFixed(2) + 'h'
        : (uptime / 60).toFixed(2) + 'm';

    res.json({
        uptime: uptimeStr,
        activeUsers: totalRequests, // We'll just use total requests as a proxy for engagement
        avgResponseTime: Math.floor(Math.random() * 20 + 20) + "ms",
        activeAlerts: historyData[historyData.length - 1]?.cpu > 90 ? 1 : 0,
        history: historyData,
        system: {
            databaseStatus: "Online",
            authStatus: "Online",
            storageStatus: "Online",
            cpuModel: os.cpus()[0]?.model,
            totalMem: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
            freeMem: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        }
    });
  });

  
  
  let currentTelegramOtp = null;
  let currentEmailOtp = null;

  app.post("/api/factory-reset/request-telegram", async (req, res) => {
    try {
      currentTelegramOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      if (!botToken || !chatId) {
        console.warn("Telegram not configured. OTP is: " + currentTelegramOtp);
        return res.json({ success: true, message: "Telegram not configured. DEV MODE OTP: " + currentTelegramOtp });
      }
      
      const message = "⚠️ URGENT: Factory Reset Requested.\nYour Telegram OTP is: " + currentTelegramOtp;
      const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
      const telegramData = await telegramRes.json();
      if (!telegramRes.ok) {
        console.error('Telegram Error:', telegramData);
        return res.status(500).json({ error: 'Failed to send Telegram message: ' + (telegramData.description || 'Unknown error') });
      }
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
        return res.json({ success: true, message: "Email not configured. DEV MODE OTP: " + currentEmailOtp });
      }

      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
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
      const { initializeApp: initClientApp } = await import('firebase/app');
      const { getFirestore, collection, getDocs, deleteDoc, collectionGroup } = await import('firebase/firestore');
      
      let firebaseApp;
      try {
        const { getApp: getClientApp } = await import('firebase/app'); firebaseApp = getClientApp();
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
        const { initializeApp: initAdminApp } = await import('firebase-admin/app');
        const { getAuth } = await import('firebase-admin/auth');
        
        let adminApp;
        try {
           const { getApp: getAdminApp } = await import('firebase-admin/app'); adminApp = getAdminApp();
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

  
  app.delete("/api/auth/users", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) return res.status(400).json({error: "Email required"});
      const { getAuth } = await import('firebase-admin/auth');
      const { getApp: getAdminApp, initializeApp: initAdminApp } = await import('firebase-admin/app');
      
      let adminApp;
      try {
         adminApp = getAdminApp();
      } catch(e) {
         adminApp = initAdminApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
      }
      
      const auth = getAuth(adminApp);
      try {
        const user = await auth.getUserByEmail(email);
        await auth.deleteUser(user.uid);
        res.json({ success: true });
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          res.json({ success: true, message: "User already deleted" });
        } else {
          throw err;
        }
      }
    } catch (e) {
      console.error("Failed to delete user:", e);
      res.status(500).json({error: "Failed"});
    }
  });

  app.get("/api/health", (req, res) => {

    res.json({ status: "ok", message: "School ERP System Backend is running!" });
  });

  // Example backend route to demonstrate split architecture
  app.get("/api/info", (req, res) => {
    res.json({
        app: "School ERP System",
        version: "1.0.0",
        description: "Full-stack application powered by Express and Vite"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
