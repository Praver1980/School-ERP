const fs = require('fs');
let code = fs.readFileSync('services/storage.ts', 'utf8');

const helpers = `
const generateSyntheticEmailForStorage = (id: string): string => {
  const sanitizedID = id.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return \`\${sanitizedID}@v2.internal.schoolapp.com\`;
};

const deleteAuthUser = (id: string) => {
  const email = generateSyntheticEmailForStorage(id);
  fetch(\`/api/auth/users?email=\${encodeURIComponent(email)}\`, { method: 'DELETE' }).catch(console.error);
};
`;

if (!code.includes('deleteAuthUser')) {
  code = code.replace("import { db } from './firebase';", "import { db } from './firebase';\n" + helpers);
}

// 1. Update removeUser
code = code.replace(
  "    deleteDoc(doc(db, 'schools', userToDelete.schoolID || 'global', getRoleCollection(userToDelete.role), recId)).catch(console.error);\n  }",
  "    deleteDoc(doc(db, 'schools', userToDelete.schoolID || 'global', getRoleCollection(userToDelete.role), recId)).catch(console.error);\n    deleteDoc(doc(db, 'users', uid)).catch(console.error);\n    deleteAuthUser(uid);\n  }"
);

// 2. Update removeStudent
code = code.replace(
  "        deleteDoc(doc(db, 'students', studentId)).catch(console.error);",
  "        const recId = getRecognizableId(student.name, student.id);\n        deleteDoc(doc(db, 'schools', student.schoolID || 'global', 'students', recId)).catch(console.error);\n        deleteDoc(doc(db, 'students', studentId)).catch(console.error);\n        deleteAuthUser(studentId);"
);

// 3. Add deletePayment
if (!code.includes('export const deletePayment')) {
  code = code.replace(
    "export const updatePayment =",
    "export const deletePayment = (id: string): void => {\n  let payments = getStoredPayments();\n  payments = payments.filter(p => p.id !== id);\n  localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));\n  deleteDoc(doc(db, 'payments', id)).catch(console.error);\n};\n\nexport const updatePayment ="
  );
}

// 4. Update removeSchool
const removeSchoolCode = `export const removeSchool = (id: string): void => {
    let schools = getStoredSchools();
    schools = schools.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));
    deleteDoc(doc(db, 'schools', id)).catch(console.error);
    
    const users = getStoredUsers().filter(u => u.schoolID === id);
    users.forEach(u => removeUser(u.uid));
    
    const students = getStoredStudents().filter(s => s.schoolID === id);
    students.forEach(s => removeStudent(s.id));
    
    const announcements = getStoredAnnouncements().filter(a => a.schoolID === id);
    announcements.forEach(a => deleteAnnouncement(a.id));
    
    const assignments = getStoredAssignments().filter(a => a.schoolID === id);
    assignments.forEach(a => deleteAssignment(a.id));
    
    const payments = getStoredPayments().filter(p => p.schoolID === id);
    payments.forEach(p => deletePayment(p.id));
};`;

code = code.replace(/export const removeSchool = \(id: string\): void => \{[\s\S]*?deleteDoc\(doc\(db, 'schools', id\)\)\.catch\(console\.error\);\n\};/, removeSchoolCode);

fs.writeFileSync('services/storage.ts', code);
