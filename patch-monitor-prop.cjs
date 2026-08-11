const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

code = code.replace("<MonitoringDashboard />", "<MonitoringDashboard onFactoryReset={handleWipeDatabase} />");

fs.writeFileSync('pages/AdminDashboard.tsx', code);
console.log("Patched AdminDashboard.tsx with onFactoryReset prop");
