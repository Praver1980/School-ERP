import fs from 'fs';
let content = fs.readFileSync('services/storage.ts', 'utf8');

const newSubmit = `export const submitAssignment = (assignmentId: string, submission: import('../types').AssignmentSubmission): void => {
  const storedSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
  let submissions = storedSubs ? JSON.parse(storedSubs) : [];
  
  // Create unique ID for submission if none exists
  submission.id = submission.id || 'sub_' + Math.random().toString(36).substr(2, 9);
  submission.assignmentId = assignmentId;
  
  // Find assignment to get loginId
  const assignments = getStoredAssignments();
  const assignment = assignments.find(a => a.id === assignmentId);
  if (assignment && assignment.loginId) {
      submission.loginId = assignment.loginId;
  }
  
  // Remove previous submission
  submissions = submissions.filter((s: any) => !(s.assignmentId === assignmentId && s.studentId === submission.studentId));
  submissions.push(submission);
  
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
  setDoc(doc(db, 'assignment_submissions', submission.id!), submission).catch(console.error);
};`;

const newUpdateStatus = `export const updateSubmissionStatus = (
  assignmentId: string, 
  studentId: string, 
  teacherVerified: 'pending' | 'verified' | 'rejected', 
  completionStatus: 'pending' | 'complete' | 'incomplete'
): void => {
  const storedSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
  let submissions = storedSubs ? JSON.parse(storedSubs) : [];
  
  const subIndex = submissions.findIndex((s: any) => s.assignmentId === assignmentId && s.studentId === studentId);
  if (subIndex !== -1) {
    submissions[subIndex].teacherVerified = teacherVerified;
    submissions[subIndex].completionStatus = completionStatus;
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
    setDoc(doc(db, 'assignment_submissions', submissions[subIndex].id), submissions[subIndex]).catch(console.error);
  }
};`;

content = content.replace(/export const submitAssignment =.*?};\n/s, newSubmit + '\n');
content = content.replace(/export const updateSubmissionStatus =.*?};\n/s, newUpdateStatus + '\n');

fs.writeFileSync('services/storage.ts', content);
