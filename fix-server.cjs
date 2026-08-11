const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const wipeStart = code.indexOf("let currentTelegramOtp = null;");
const healthStart = code.indexOf("app.get(\"/api/health\", (req, res) => {");

if (wipeStart !== -1 && healthStart !== -1) {
    const fixedCode = code.substring(0, wipeStart) + code.substring(wipeStart, code.indexOf("app.post(\"/api/factory-reset/execute\"", wipeStart)) + code.substring(code.indexOf("app.post(\"/api/factory-reset/execute\"", wipeStart), code.indexOf("});", code.indexOf("res.status(500).json({ error: \"Failed to wipe database\" });")) + 3) + "\n\n  " + code.substring(healthStart);
    fs.writeFileSync('server.ts', fixedCode);
}
