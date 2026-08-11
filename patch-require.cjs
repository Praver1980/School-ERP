const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('import { createRequire } from')) {
  code = "import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);\n" + code;
  fs.writeFileSync('server.ts', code);
}
