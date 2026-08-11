const fs = require('fs');
let code = fs.readFileSync('services/storage.ts', 'utf8');

code = code.replace(
  "    deleteAuthUser(uid);\n  }",
  "    deleteAuthUser(uid);\n    \n    const messages = getStoredMessages().filter(m => m.senderId === uid || m.receiverId === uid);\n    messages.forEach(m => deleteMessage(m.id));\n  }"
);

code = code.replace(
  "        deleteAuthUser(studentId);",
  "        deleteAuthUser(studentId);\n        const messages = getStoredMessages().filter(m => m.senderId === studentId || m.receiverId === studentId);\n        messages.forEach(m => deleteMessage(m.id));"
);

fs.writeFileSync('services/storage.ts', code);
