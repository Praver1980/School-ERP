const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

code = code.replace(/setAlertState\(\{ isOpen: true, message: (.*?) \}\);/g, 'alert($1);');

fs.writeFileSync('pages/AdminDashboard.tsx', code);
console.log("Fixed alerts");
