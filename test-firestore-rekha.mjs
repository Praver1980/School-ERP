import dotenv from 'dotenv';
dotenv.config();
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});

const db = getFirestore();

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
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();
