const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes("import nodemailer")) {
  code = code.replace('import os from "os";', 'import os from "os";\nimport nodemailer from "nodemailer";');
}

const apiRoute = `
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

      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@schoolerpsystem.com',
        to: adminEmail,
        subject: \`New Demo Request from \${name}\`,
        text: \`New Demo Request Details:\\n\\nName: \${name}\\nEmail: \${email}\\nPhone: \${phone}\\nAddress: \${address}\`
      };

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("DEMO REQUEST RECEIVED (Email not configured in .env):\\n", mailOptions.text);
        return res.json({ success: true, message: "Logged to console (SMTP credentials not found in .env)" });
      }

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error) {
      console.error("Email Error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/notify",`;

code = code.replace('  app.post("/api/notify",', apiRoute);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with nodemailer route");
