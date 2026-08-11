const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

const startIdx = code.indexOf("if (currentPage === 'payments') {");
if (startIdx === -1) {
  console.log("Not found");
  process.exit(1);
}

const endIdx = code.indexOf("  return (\n    <div className=\"space-y-6\">");

const blockToRemove = code.substring(startIdx, endIdx);

const jsxStartIdx = blockToRemove.indexOf("return (") + 8;
const jsxEndIdx = blockToRemove.lastIndexOf(");");
const jsxContent = blockToRemove.substring(jsxStartIdx, jsxEndIdx).trim();

const newBlock = `
      {activeTab === 'payments' && (
        ${jsxContent}
      )}
`;

code = code.substring(0, startIdx) + code.substring(endIdx);

const insertIdx = code.lastIndexOf("<ConfirmModal");
code = code.substring(0, insertIdx) + newBlock + "\n      " + code.substring(insertIdx);

fs.writeFileSync('pages/AdminDashboard.tsx', code);
console.log("Fixed AdminDashboard");
