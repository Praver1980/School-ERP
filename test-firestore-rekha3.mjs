import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp({
  projectId: config.projectId
});

// For admin SDK, you can specify databaseId when getting firestore
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const schoolId = 'sch-8955'; // Using the ID from the image
    
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
    
    console.log("Successfully created data under " + schoolId);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();
