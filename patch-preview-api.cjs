const fs = require('fs');
let code = fs.readFileSync('pages/AnonymousPreview.tsx', 'utf8');

code = code.replace("await fetch('/api/notify', {", "await fetch('/api/request-demo', {");
code = code.replace("body: JSON.stringify({ message })", "body: JSON.stringify(demoForm)");
code = code.replace("const message = \\`🎉 *New Demo Request* 🎉\\\\n\\\\n*Name:* \\${demoForm.name}\\\\n*Email:* \\${demoForm.email}\\\\n*Phone:* \\${demoForm.phone}\\\\n*Address:* \\${demoForm.address}\\\\n\\\\n_Please follow up at your earliest convenience._\\`;\\n      ", "");

fs.writeFileSync('pages/AnonymousPreview.tsx', code);
console.log("Patched AnonymousPreview.tsx api call");
