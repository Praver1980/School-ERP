const fs = require('fs');
let code = fs.readFileSync('services/storage.ts', 'utf8');

code = code.replace(
  "const payments = getStoredPayments().filter(p => p.schoolID === id);",
  "const payments = getStoredPayments().filter(p => {\n        // payments don't have schoolID directly, but we can match by principal's schoolID if needed\n        // Actually, we are deleting the users (principals) anyway. But to be thorough:\n        const school = getStoredSchools().find(s => s.id === id);\n        return p.schoolName === school?.name;\n    });"
);

fs.writeFileSync('services/storage.ts', code);
