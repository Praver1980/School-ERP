const fs = require('fs');
let code = fs.readFileSync('services/storage.ts', 'utf8');

// Filter out users from students array and vice versa
code = code.replace(
  "allStudents = snap.docs.map(d => d.data());",
  "const raw = snap.docs.map(d => d.data());\n      allStudents = raw.filter(d => d.role !== 'student');"
);

fs.writeFileSync('services/storage.ts', code);
