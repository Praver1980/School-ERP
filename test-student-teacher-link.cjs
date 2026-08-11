const fs = require('fs');

const storageTs = fs.readFileSync('services/storage.ts', 'utf8');

if (!storageTs.includes("getTeacherForStudent")) {
  console.log("Error: patch didn't apply!");
  process.exit(1);
}

console.log("Patch successfully applied!");
