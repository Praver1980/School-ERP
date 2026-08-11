require('dotenv').config();
const admin = require('firebase-admin');

admin.initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function run() {
  try {
    const schoolId = 'Rekha123';
    
    // Create teacher
    const teacherRef = db.collection('schools').doc(schoolId).collection('teachers').doc('dummy_teacher');
    await teacherRef.set({
      name: 'Test Teacher',
      student: 'Test Student'
    });
    
    // Create student subcollection just in case
    const studentRef = teacherRef.collection('students').doc('dummy_student');
    await studentRef.set({
      name: 'Test Student',
      grade: '10th'
    });
    
    console.log("Successfully created data under Rekha123");
  } catch(e) {
    console.error(e);
  }
}

run();
