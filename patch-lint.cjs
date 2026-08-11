const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace('const email = req.query.email;', 'const email = req.query.email as string;');
fs.writeFileSync('server.ts', serverCode);

let storageCode = fs.readFileSync('services/storage.ts', 'utf8');
storageCode = storageCode.replace('const announcements = getStoredAnnouncements().filter(a => a.schoolID === id);', 'const announcements = getStoredAnnouncements().filter(a => a.schoolName === school?.name);');
storageCode = storageCode.replace('const assignments = getStoredAssignments().filter(a => a.schoolID === id);', 'const assignments = getStoredAssignments().filter(a => a.schoolName === school?.name);');
fs.writeFileSync('services/storage.ts', storageCode);

