const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const route = `
  app.delete("/api/auth/users", async (req, res) => {
    try {
      const email = req.query.email;
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
`;

if (!code.includes('/api/auth/users')) {
  code = code.replace('app.get("/api/health", (req, res) => {', route + '\n  app.get("/api/health", (req, res) => {');
  fs.writeFileSync('server.ts', code);
}
