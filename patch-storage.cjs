const fs = require('fs');
let code = fs.readFileSync('services/storage.ts', 'utf8');
code = code.replace(
  "const getRecognizableId = (name: string, id: string) => {\n  const safeName = (name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');\n  return `${safeName}_${id.substring(id.length - 6)}`;\n};",
  "const getRecognizableId = (name: string, id: string) => {\n  const safeName = (name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');\n  const safeId = id || '000000';\n  return `${safeName}_${safeId.substring(Math.max(0, safeId.length - 6))}`;\n};"
);
fs.writeFileSync('services/storage.ts', code);
