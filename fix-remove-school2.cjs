const fs = require('fs');
let code = fs.readFileSync('services/storage.ts', 'utf8');

code = code.replace(
  "export const removeSchool = (id: string): void => {\n    let schools = getStoredSchools();\n    schools = schools.filter(s => s.id !== id);\n    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));",
  "export const removeSchool = (id: string): void => {\n    let schools = getStoredSchools();\n    const school = schools.find(s => s.id === id);\n    schools = schools.filter(s => s.id !== id);\n    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));"
);

code = code.replace(
  "const school = getStoredSchools().find(s => s.id === id);",
  ""
);

fs.writeFileSync('services/storage.ts', code);
