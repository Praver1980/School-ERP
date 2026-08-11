const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'res.status(500).json({ error: "Failed to wipe database" });\n\n  app.get("/api/health", (req, res) => {',
  'res.status(500).json({ error: "Failed to wipe database" });\n    }\n  });\n\n  app.get("/api/health", (req, res) => {'
);
fs.writeFileSync('server.ts', code);
