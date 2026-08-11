const fs = require('fs');
let code = fs.readFileSync('services/storage.ts', 'utf8');

code = code.replace(
  "u.schoolID === student.schoolID && u.role === UserRole.TEACHER",
  "u.schoolName === student.schoolName && u.role === UserRole.TEACHER"
);

fs.writeFileSync('services/storage.ts', code);
