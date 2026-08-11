import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const schoolId = 'sch-8955';
    
    // Create teacher
    const teacherRef = doc(db, 'schools', schoolId, 'teachers', 'dummy_teacher');
    await setDoc(teacherRef, {
      name: 'Test Teacher',
      student: 'Test Student'
    });
    
    // Create student subcollection just in case
    const studentRef = doc(db, 'schools', schoolId, 'teachers', 'dummy_teacher', 'students', 'dummy_student');
    await setDoc(studentRef, {
      name: 'Test Student',
      grade: '10th'
    });
    
    const rekhaSchoolId = 'Rekha123';
    
    // Create teacher for Rekha123
    const teacherRef2 = doc(db, 'schools', rekhaSchoolId, 'teachers', 'dummy_teacher');
    await setDoc(teacherRef2, {
      name: 'Test Teacher',
      student: 'Test Student'
    });
    
    // Create student subcollection just in case
    const studentRef2 = doc(db, 'schools', rekhaSchoolId, 'teachers', 'dummy_teacher', 'students', 'dummy_student');
    await setDoc(studentRef2, {
      name: 'Test Student',
      grade: '10th'
    });
    
    console.log("Successfully created data using Web SDK");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();
