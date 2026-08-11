const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

code = code.replace(/alert\('(.*?)' \} \);\)/g, "alert('$1');");
code = code.replace(/alert\('(.*?)' \}\);/g, "alert('$1');");
code = code.replace(/alert\('(.*?)'\}\);/g, "alert('$1');");

fs.writeFileSync('pages/AdminDashboard.tsx', code);
