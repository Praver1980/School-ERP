import fs from 'fs';
let content = fs.readFileSync('services/storage.ts', 'utf8');

const newAdd = `export const addAssignment = (assignment: Assignment): void => {
  let items = getStoredAssignments().map((a: any) => {
      const { submissions, ...rest } = a;
      return rest;
  });
  
  const { submissions, ...assignmentToSave } = assignment as any;
  items.unshift(assignmentToSave);
  localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(items));
  setDoc(doc(db, 'assignments', assignment.id), assignmentToSave).catch(console.error);
};`;

const newUpdate = `export const updateAssignment = (updatedAssignment: Assignment): void => {
  let items = getStoredAssignments().map((a: any) => {
      const { submissions, ...rest } = a;
      return rest;
  });
  
  const index = items.findIndex(a => a.id === updatedAssignment.id);
  if (index !== -1) {
    const { submissions, ...assignmentToSave } = updatedAssignment as any;
    items[index] = assignmentToSave;
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(items));
    setDoc(doc(db, 'assignments', updatedAssignment.id), assignmentToSave).catch(console.error);
  }
};`;

content = content.replace(/export const addAssignment =.*?};\n/s, newAdd + '\n');
content = content.replace(/export const updateAssignment =.*?};\n/s, newUpdate + '\n');

fs.writeFileSync('services/storage.ts', content);
