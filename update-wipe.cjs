const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

const oldMsg = "'Are you absolutely sure? This will delete ALL data (schools, staff, students, assignments, etc.). ONLY the Supreme Admin will remain. This action CANNOT be undone.'";
const newMsg = "'Are you absolutely sure? This will permanently delete ALL data (schools, staff, students, assignments, etc.). ONLY the Supreme Admin will remain in the database. NOTE: Firebase Authentication users cannot be deleted automatically from this panel; you must delete them manually from your Firebase Console.'";

code = code.replace(oldMsg, newMsg);

// Let's also make sure admin schools aren't deleted. If an admin has schoolID 'admin9945', we should preserve that school document if it exists.
code = code.replace("if (col === 'users' && d.id === 'u_admin') continue;", "if (col === 'users' && d.id === 'u_admin') continue;\n              if (col === 'schools' && d.id === 'admin9945') continue;");

fs.writeFileSync('pages/AdminDashboard.tsx', code);
