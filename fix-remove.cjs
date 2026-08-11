const fs = require('fs');
let code = fs.readFileSync('services/storage.ts', 'utf8');

// removeUser
const userMatch = /export const removeUser = \(uid: string\): void => \{[\s\S]*?deleteDoc\(doc\(db, 'schools', userToDelete\.schoolID \|\| 'global', getRoleCollection\(userToDelete\.role\), recId\)\)\.catch\(console\.error\);\n    }\n  }\n\};/;

const userReplace = `export const removeUser = (uid: string): void => {
  let users = getStoredUsers();
  const userToDelete = users.find(u => u.uid === uid);
  users = users.filter(u => u.uid !== uid);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  
  if (userToDelete) {
    const recId = getRecognizableId(userToDelete.name, userToDelete.uid);
    deleteDoc(doc(db, 'schools', userToDelete.schoolID || 'global', getRoleCollection(userToDelete.role), recId)).catch(console.error);
  }
};`;

code = code.replace(userMatch, userReplace);

// removeStudent
const studentMatch = /export const removeStudent = \(id: string\): void => \{[\s\S]*?deleteDoc\(doc\(db, 'schools', studentToDelete\.schoolID \|\| 'global', 'students', recId\)\)\.catch\(console\.error\);\n    }\n  }\n\};/;

const studentReplace = `export const removeStudent = (id: string): void => {
  let students = getStoredStudents();
  const studentToDelete = students.find(s => s.id === id);
  students = students.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  
  if (studentToDelete) {
    const recId = getRecognizableId(studentToDelete.name, studentToDelete.id);
    deleteDoc(doc(db, 'schools', studentToDelete.schoolID || 'global', 'students', recId)).catch(console.error);
  }
};`;

code = code.replace(studentMatch, studentReplace);

fs.writeFileSync('services/storage.ts', code);
console.log("Fixed delete functions.");
