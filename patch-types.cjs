const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf8');

code = code.replace("  MONITORING = 'monitoring'\n", "");

fs.writeFileSync('types.ts', code);
console.log("Patched types");
