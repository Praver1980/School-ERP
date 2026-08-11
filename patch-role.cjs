const fs = require('fs');
let code = fs.readFileSync('services/storage.ts', 'utf8');

code = code.replace(
  "case UserRole.STUDENT: return 'students';",
  "case UserRole.STUDENT: return 'users';"
);

fs.writeFileSync('services/storage.ts', code);
