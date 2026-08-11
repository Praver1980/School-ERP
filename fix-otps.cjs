const fs = require('fs');

// Fix server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
  'return res.json({ success: true, message: "Telegram not configured, OTP printed in logs." });',
  'return res.json({ success: true, message: "Telegram not configured. DEV MODE OTP: " + currentTelegramOtp });'
);
serverCode = serverCode.replace(
  'return res.json({ success: true, message: "Email not configured, OTP printed in logs." });',
  'return res.json({ success: true, message: "Email not configured. DEV MODE OTP: " + currentEmailOtp });'
);
fs.writeFileSync('server.ts', serverCode);

// Fix AdminDashboard.tsx
let adminCode = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');
adminCode = adminCode.replace(
  "await fetch('/api/factory-reset/request-telegram', { method: 'POST' });\n                       setResetModal(prev => ({...prev, loading: false, step: 2}));",
  "const res = await fetch('/api/factory-reset/request-telegram', { method: 'POST' });\n                       const data = await res.json();\n                       if (data.message) alert(data.message);\n                       setResetModal(prev => ({...prev, loading: false, step: 2}));"
);
adminCode = adminCode.replace(
  "await fetch('/api/factory-reset/request-email', { method: 'POST' });\n                       setResetModal(prev => ({...prev, loading: false, step: 3}));",
  "const res = await fetch('/api/factory-request/request-email', { method: 'POST' });\n                       const data = await res.json();\n                       if (data.message) alert(data.message);\n                       setResetModal(prev => ({...prev, loading: false, step: 3}));"
);

// Fallback regex if the exact string match fails for email due to spacing
if (!adminCode.includes("const data = await res.json();")) {
  adminCode = adminCode.replace(
    /await fetch\('\/api\/factory-reset\/request-email', \{ method: 'POST' \}\);\s*setResetModal/g,
    "const res = await fetch('/api/factory-reset/request-email', { method: 'POST' });\n                       const data = await res.json();\n                       if (data.message) alert(data.message);\n                       setResetModal"
  );
}

fs.writeFileSync('pages/AdminDashboard.tsx', adminCode);
