const fs = require('fs');
let code = fs.readFileSync('services/storage.ts', 'utf8');

// We need a helper to get the teacher for a student
const getTeacherRefPath = `
const getTeacherForStudent = (student: StudentRecord) => {
  const users = getStoredUsers();
  return users.find(u => u.schoolID === student.schoolID && u.role === UserRole.TEACHER && u.assignedClass === student.className);
};
`;

if (!code.includes('getTeacherForStudent')) {
  code = code.replace("export const getStoredStudents = (): StudentRecord[] => {", getTeacherRefPath + "\nexport const getStoredStudents = (): StudentRecord[] => {");
}

// 1. update addStudent
code = code.replace(
  "setDoc(doc(db, 'schools', student.schoolID || 'global', 'students', recId), student).catch(console.error);",
  "const teacher = getTeacherForStudent(student);\n  if (teacher) {\n    const teacherRecId = getRecognizableId(teacher.name, teacher.uid);\n    setDoc(doc(db, 'schools', student.schoolID || 'global', 'teachers', teacherRecId, 'students', recId), student).catch(console.error);\n  } else {\n    setDoc(doc(db, 'schools', student.schoolID || 'global', 'students', recId), student).catch(console.error);\n  }"
);

// 2. update updateStudent
code = code.replace(
  "setDoc(doc(db, 'schools', updatedStudent.schoolID || 'global', 'students', recId), updatedStudent).catch(console.error);",
  "const teacher = getTeacherForStudent(updatedStudent);\n    if (teacher) {\n      const teacherRecId = getRecognizableId(teacher.name, teacher.uid);\n      setDoc(doc(db, 'schools', updatedStudent.schoolID || 'global', 'teachers', teacherRecId, 'students', recId), updatedStudent).catch(console.error);\n    } else {\n      setDoc(doc(db, 'schools', updatedStudent.schoolID || 'global', 'students', recId), updatedStudent).catch(console.error);\n    }"
);

// 3. update removeStudent
code = code.replace(
  "deleteDoc(doc(db, 'schools', student.schoolID || 'global', 'students', recId)).catch(console.error);",
  "const teacher = getTeacherForStudent(student);\n        if (teacher) {\n          const teacherRecId = getRecognizableId(teacher.name, teacher.uid);\n          deleteDoc(doc(db, 'schools', student.schoolID || 'global', 'teachers', teacherRecId, 'students', recId)).catch(console.error);\n        } else {\n          deleteDoc(doc(db, 'schools', student.schoolID || 'global', 'students', recId)).catch(console.error);\n        }"
);

// 4. update saveAllStudents
code = code.replace(
  "setDoc(doc(db, 'schools', s.schoolID || 'global', 'students', recId), s).catch(console.error);",
  "const teacher = getTeacherForStudent(s);\n    if (teacher) {\n      const teacherRecId = getRecognizableId(teacher.name, teacher.uid);\n      setDoc(doc(db, 'schools', s.schoolID || 'global', 'teachers', teacherRecId, 'students', recId), s).catch(console.error);\n    } else {\n      setDoc(doc(db, 'schools', s.schoolID || 'global', 'students', recId), s).catch(console.error);\n    }"
);

fs.writeFileSync('services/storage.ts', code);
