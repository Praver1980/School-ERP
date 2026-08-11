const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

// The block to remove starts with "if (currentPage === 'payments') {"
// and ends with "    return (" right before it. Wait, no.

const startIdx = code.indexOf("if (currentPage === 'payments') {");
if (startIdx === -1) {
  console.log("Not found");
  process.exit(1);
}

// Find the end of this if block. It ends right before "return (" of the main component.
// The main component return is "  return (\n    <div className=\"space-y-6\">"
const endIdx = code.indexOf("  return (\n    <div className=\"space-y-6\">");

const blockToRemove = code.substring(startIdx, endIdx);

// Extract the inner JSX from the block to remove
const jsxStartIdx = blockToRemove.indexOf("return (") + 8;
const jsxEndIdx = blockToRemove.lastIndexOf(");");
const jsxContent = blockToRemove.substring(jsxStartIdx, jsxEndIdx).trim();

// Now create the new block
const newBlock = `
      {activeTab === 'payments' && (
        ${jsxContent}
      )}
`;

// Remove the old block
code = code.substring(0, startIdx) + code.substring(endIdx);

// Insert the new block right before the ConfirmModal
const insertIdx = code.lastIndexOf("<ConfirmModal");
code = code.substring(0, insertIdx) + newBlock + "\n      " + code.substring(insertIdx);

fs.writeFileSync('pages/AdminDashboard.tsx', code);
console.log("Fixed AdminDashboard");
