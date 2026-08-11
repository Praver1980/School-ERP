import { User, UserRole, StudentRecord, Announcement, ERPDatabase, School, SchoolConfig, Assignment, Message } from '../types';
import { SCHOOL_NAMES } from '../constants';



import { supabase } from './supabase';

const db = {};
const doc = (...args: any[]) => args;
const collection = (...args: any[]) => args;
const collectionGroup = (...args: any[]) => args;
const query = (...args: any[]) => args;
const where = (...args: any[]) => args;

const setDoc = async (pathArgs: any[], data: any) => {
  try {
    let table = pathArgs[1];
    if (pathArgs[1] === 'schools' && pathArgs.length >= 4) {
      table = pathArgs[3]; 
    }
    if (table === 'principals' || table === 'teachers' || table === 'admins') {
      table = 'users';
    }
    await supabase.from(table).upsert(data);
  } catch(e) { console.error(e); }
};

const deleteDoc = async (pathArgs: any[]) => {
  try {
    let table = pathArgs[1];
    let id = pathArgs[pathArgs.length - 1];
    if (pathArgs[1] === 'schools' && pathArgs.length >= 4) {
      table = pathArgs[3];
    }
    if (table === 'principals' || table === 'teachers' || table === 'admins') {
      table = 'users';
    }
    await supabase.from(table).delete().eq('id', id).eq('uid', id);
  } catch(e) { console.error(e); }
};

const onSnapshot = (queryArgs: any, callback: (snap: any) => void, errorCallback?: (error: any) => void) => {
  return () => {};
};

// --- END SHIM ---




// --- END SHIM ---




// --- END SHIM ---




const generateSyntheticEmailForStorage = (id: string): string => {
  const sanitizedID = id.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return `${sanitizedID}@v2.internal.schoolapp.com`;
};

const deleteAuthUser = (id: string) => {
  const email = generateSyntheticEmailForStorage(id);
  fetch(`/api/auth/users?email=${encodeURIComponent(email)}`, { method: 'DELETE' }).catch(console.error);
};

const STORAGE_KEY_USERS = 'nexus_erp_users_v2';
const STORAGE_KEY_STUDENTS = 'nexus_erp_students_v2';
const STORAGE_KEY_ANNOUNCEMENTS = 'nexus_erp_announcements_v1';
const STORAGE_KEY_SCHOOLS = 'nexus_erp_schools_v2'; 
const STORAGE_KEY_ASSIGNMENTS = 'nexus_erp_assignments_v1';
const STORAGE_KEY_SUBMISSIONS = 'nexus_erp_submissions_v1';
const STORAGE_KEY_MESSAGES = 'nexus_erp_messages_v1';
const STORAGE_KEY_PAYMENTS = 'nexus_erp_payments_v1';

const getRecognizableId = (name: string, id: string) => {
  const safeName = (name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
  const safeId = id || '000000';
  return `${safeName}_${safeId.substring(Math.max(0, safeId.length - 6))}`;
};

const getRoleCollection = (role: UserRole) => {
  switch (role) {
    case UserRole.PRINCIPAL: return 'principals';
    case UserRole.TEACHER: return 'teachers';
    case UserRole.STUDENT: return 'users';
    case UserRole.SUPREME_ADMIN: return 'admins';
    default: return 'users';
  }
};

const INITIAL_USERS: User[] = [
  {
    uid: 'u_admin',
    loginId: 'admin9945',
    name: 'System Administrator',
    role: UserRole.SUPREME_ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=System+Admin&background=10b981&color=fff',
    password: '201212'
  }
];

export const initializeSupabaseSync = async (user: User | null = null) => {
  if (!user) return; // Only sync if logged in

  const isSupremeAdmin = user.role === UserRole.SUPREME_ADMIN;
  
  // Helper to fetch data
  const fetchTable = async (table: string, useSchoolFilter: boolean = true) => {
    let query = supabase.from(table).select('*');
    if (!isSupremeAdmin && useSchoolFilter && user.schoolID) {
      query = query.eq('schoolID', user.schoolID);
    } else if (!isSupremeAdmin && useSchoolFilter && user.schoolName && table === 'schools') {
      query = query.eq('name', user.schoolName);
    }
    const { data, error } = await query;
    if (error) console.error("Error fetching", table, error);
    return data || [];
  };

  try {
    const [
      announcements,
      schools,
      assignments,
      submissions,
      payments,
      students,
      usersList
    ] = await Promise.all([
      fetchTable('announcements'),
      fetchTable('schools', true),
      fetchTable('assignments'),
      fetchTable('assignment_submissions'),
      fetchTable('payments'),
      fetchTable('students'),
      fetchTable('users')
    ]);

    localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(announcements));
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(usersList));
    
    // Fetch messages (RLS ensures user only sees their own)
    const { data: messages } = await supabase.from('messages').select('*');
    if (messages) localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));

    window.dispatchEvent(new Event('nexus_data_changed'));
  } catch (error) {
    console.error("Initial sync error:", error);
  }

  // Setup Realtime for critical updates (Messages & Announcements)
  const channel = supabase.channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        supabase.from('messages').select('*').then(({data}) => {
            if(data) {
                localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(data));
                window.dispatchEvent(new Event('nexus_data_changed'));
            }
        });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
        fetchTable('announcements').then((data) => {
            localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(data));
            window.dispatchEvent(new Event('nexus_data_changed'));
        });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};


const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to the New Term',
    content: 'We are excited to start the new academic year. Please ensure all student records are updated by Friday.',
    date: new Date().toISOString().split('T')[0],
    audience: 'all',
    author: 'Principal'
  }
];

const DEFAULT_SCHOOL_CONFIG: SchoolConfig = {
    maxMarks: 100,
    houseNames: ['Green', 'Blue', 'Yellow', 'Red'],
    streams: ['Science', 'Commerce', 'Humanities']
};

// --- Helper for Auto-Roll Number Generation ---
export const recalculateRollNumbers = (className: string): void => {
  const allStudents = getStoredStudents();
  // Filter students of this class
  const classStudents = allStudents.filter(s => s.className === className);
  const otherStudents = allStudents.filter(s => s.className !== className);
  
  // Sort alphabetically by name
  classStudents.sort((a, b) => a.name.localeCompare(b.name));
  
  // Assign roll numbers sequentially
  classStudents.forEach((s, index) => {
    s.rollNumber = index + 1;
  });
  
  // Save merged list
  const merged = [...otherStudents, ...classStudents];
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(merged));
};

export const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEY_USERS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(stored);
};

export const addUser = (user: User): void => {
  const users = getStoredUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  const recId = getRecognizableId(user.name, user.uid);
  setDoc(doc(db, 'schools', user.loginId || 'global', getRoleCollection(user.role), recId), user).catch(console.error);
  setDoc(doc(db, 'users', user.uid), user).catch(console.error);
};

export const updateUser = (updatedUser: User): void => {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.uid === updatedUser.uid);
  if (index !== -1) {
    users[index] = updatedUser;
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    const recId = getRecognizableId(updatedUser.name, updatedUser.uid);
    setDoc(doc(db, 'schools', updatedUser.loginId || 'global', getRoleCollection(updatedUser.role), recId), updatedUser).catch(console.error);
    setDoc(doc(db, 'users', updatedUser.uid), updatedUser).catch(console.error);
  }
};

export const removeUser = (uid: string): void => {
  let users = getStoredUsers();
  const userToDelete = users.find(u => u.uid === uid);
  users = users.filter(u => u.uid !== uid);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  
  if (userToDelete) {
    const recId = getRecognizableId(userToDelete.name, userToDelete.uid);
    deleteDoc(doc(db, 'schools', userToDelete.loginId || 'global', getRoleCollection(userToDelete.role), recId)).catch(console.error);
    deleteDoc(doc(db, 'users', uid)).catch(console.error);
    deleteAuthUser(uid);
    
    const messages = getStoredMessages().filter(m => m.senderId === uid || m.receiverId === uid);
    messages.forEach(m => deleteMessage(m.id));
  }
};


const getTeacherForStudent = (student: StudentRecord) => {
  const users = getStoredUsers();
  return users.find(u => u.schoolName === student.schoolName && u.role === UserRole.TEACHER && u.assignedClass === student.className);
};

export const getStoredStudents = (): StudentRecord[] => {
  const stored = localStorage.getItem(STORAGE_KEY_STUDENTS);
  return stored ? JSON.parse(stored) : [];
};

export const addStudent = (student: StudentRecord): void => {
  const students = getStoredStudents();
  // Ensure history object exists
  if (!student.attendanceHistory) {
      student.attendanceHistory = {};
  }
  students.push(student);
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  const recId = getRecognizableId(student.name, student.id);
  
  setDoc(doc(db, 'schools', student.loginId || 'global', 'students', recId), student).catch(console.error);
  
  // Auto-calculate roll numbers for the class
  recalculateRollNumbers(student.className);
};

export const updateStudent = (updatedStudent: StudentRecord): void => {
  const students = getStoredStudents();
  const index = students.findIndex(s => s.id === updatedStudent.id);
  
  if (index !== -1) {
    const oldClass = students[index].className;
    students[index] = updatedStudent;
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    const recId = getRecognizableId(updatedStudent.name, updatedStudent.id);
    
    setDoc(doc(db, 'schools', updatedStudent.loginId || 'global', 'students', recId), updatedStudent).catch(console.error);
    
    // Recalculate for new class
    recalculateRollNumbers(updatedStudent.className);
    
    // If class changed, recalculate for old class to fill gaps
    if (oldClass !== updatedStudent.className) {
        recalculateRollNumbers(oldClass);
    }
  }
};

export const removeStudent = (studentId: string): void => {
    const students = getStoredStudents();
    const student = students.find(s => s.id === studentId);
    
    if (student) {
        const className = student.className;
        const newList = students.filter(s => s.id !== studentId);
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(newList));
        const recId = getRecognizableId(student.name, student.id);
        
        deleteDoc(doc(db, 'schools', student.loginId || 'global', 'students', recId)).catch(console.error);
        deleteDoc(doc(db, 'users', studentId)).catch(console.error);
        
        deleteAuthUser(studentId);
        const messages = getStoredMessages().filter(m => m.senderId === studentId || m.receiverId === studentId);
        messages.forEach(m => deleteMessage(m.id));
        // Re-assign roll numbers for the class to fill the gap
        recalculateRollNumbers(className);
    }
};

export const saveAllStudents = (students: StudentRecord[]): void => {
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  students.forEach(s => {
    const recId = getRecognizableId(s.name, s.id);
    setDoc(doc(db, 'schools', s.loginId || 'global', 'students', recId), s).catch(console.error);
  });
};

export const getStoredAnnouncements = (): Announcement[] => {
  const stored = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    return INITIAL_ANNOUNCEMENTS;
  }
  return JSON.parse(stored);
};

export const addAnnouncement = (announcement: Announcement): void => {
  const items = getStoredAnnouncements();
  items.unshift(announcement);
  localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(items));
  setDoc(doc(db, 'announcements', announcement.id), announcement).catch(console.error);
};

export const deleteAnnouncement = (id: string): void => {
  let items = getStoredAnnouncements();
  items = items.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(items));
  deleteDoc(doc(db, 'announcements', id)).catch(console.error);
};

// --- ASSIGNMENTS MANAGEMENT ---
export const getStoredAssignments = (): Assignment[] => {
  const stored = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
  const assignments = stored ? JSON.parse(stored) : [];
  const storedSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
  const submissions = storedSubs ? JSON.parse(storedSubs) : [];
  return assignments.map((a: any) => ({ ...a, submissions: submissions.filter((s: any) => s.assignmentId === a.id) }));
};

export const addAssignment = (assignment: Assignment): void => {
  let items = getStoredAssignments().map((a: any) => {
      const { submissions, ...rest } = a;
      return rest;
  });
  
  const { submissions, ...assignmentToSave } = assignment as any;
  items.unshift(assignmentToSave);
  localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(items));
  setDoc(doc(db, 'assignments', assignment.id), assignmentToSave).catch(console.error);
};

export const updateAssignment = (updatedAssignment: Assignment): void => {
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
};

export const submitAssignment = (assignmentId: string, submission: import('../types').AssignmentSubmission): void => {
  const storedSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
  let submissions = storedSubs ? JSON.parse(storedSubs) : [];
  
  // Create unique ID for submission if none exists
  submission.id = submission.id || 'sub_' + Math.random().toString(36).substr(2, 9);
  submission.assignmentId = assignmentId;
  
  // Find assignment to get loginId
  const assignments = getStoredAssignments();
  const assignment = assignments.find(a => a.id === assignmentId);
  if (assignment && assignment.schoolID) {
      submission.schoolID = assignment.schoolID;
  }
  
  // Remove previous submission
  submissions = submissions.filter((s: any) => !(s.assignmentId === assignmentId && s.studentId === submission.studentId));
  submissions.push(submission);
  
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
  setDoc(doc(db, 'assignment_submissions', submission.id!), submission).catch(console.error);
};

export const updateSubmissionStatus = (
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
};

export const deleteAssignment = (id: string): void => {
  let items = getStoredAssignments();
  items = items.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(items));
  deleteDoc(doc(db, 'assignments', id)).catch(console.error);
};

// --- SCHOOL MANAGEMENT ---
export const getStoredSchools = (): School[] => {
  const stored = localStorage.getItem(STORAGE_KEY_SCHOOLS);
  if (!stored) {
    // Initialize with default constants if first run
    const defaults: School[] = SCHOOL_NAMES.map((name, idx) => ({
        id: `sch-init-${idx}`,
        name: name,
        config: DEFAULT_SCHOOL_CONFIG
    }));
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(defaults));
    return defaults;
  }
  const schools = JSON.parse(stored);
  // Migration for old data without config
  return schools.map((s: any) => ({
      ...s,
      config: s.config || DEFAULT_SCHOOL_CONFIG
  }));
};

export const addSchool = (name: string, config?: SchoolConfig): void => {
    const schools = getStoredSchools();
    const newSchool: School = {
        id: generateId('sch'),
        name: name.trim(),
        config: config || DEFAULT_SCHOOL_CONFIG
    };
    schools.push(newSchool);
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));
    setDoc(doc(db, 'schools', newSchool.id), newSchool).catch(console.error);
};

export const updateSchool = (updatedSchool: School): void => {
    const schools = getStoredSchools();
    const index = schools.findIndex(s => s.id === updatedSchool.id);
    if (index !== -1) {
        schools[index] = updatedSchool;
        localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));
        setDoc(doc(db, 'schools', updatedSchool.id), updatedSchool).catch(console.error);
    }
}

export const removeSchool = (id: string): void => {
    let schools = getStoredSchools();
    const school = schools.find(s => s.id === id);
    schools = schools.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(schools));
    deleteDoc(doc(db, 'schools', id)).catch(console.error);
    
    const users = getStoredUsers().filter(u => u.loginId === id);
    users.forEach(u => removeUser(u.uid));
    
    const students = getStoredStudents().filter(s => s.loginId === id);
    students.forEach(s => removeStudent(s.id));
    
    const announcements = getStoredAnnouncements().filter(a => a.schoolName === school?.name);
    announcements.forEach(a => deleteAnnouncement(a.id));
    
    const assignments = getStoredAssignments().filter(a => a.schoolName === school?.name);
    assignments.forEach(a => deleteAssignment(a.id));
    
    const payments = getStoredPayments().filter(p => {
        // payments don't have loginId directly, but we can match by principal's loginId if needed
        // Actually, we are deleting the users (principals) anyway. But to be thorough:
        
        return p.schoolName === school?.name;
    });
    payments.forEach(p => deletePayment(p.id));
};

export const getFullDatabase = (): ERPDatabase => {
  return {
    users: getStoredUsers(),
    students: getStoredStudents(),
    announcements: getStoredAnnouncements(),
    schools: getStoredSchools(),
    assignments: getStoredAssignments(),
    messages: getStoredMessages(),
    payments: getStoredPayments()
  };
};

export const restoreFullDatabase = (data: ERPDatabase): void => {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(data.users));
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(data.students));
  localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(data.announcements));
  if (data.schools) {
      localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(data.schools));
  }
  if (data.assignments) {
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(data.assignments));
  }
  if (data.messages) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(data.messages));
  }
  if (data.payments) {
      localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(data.payments));
  }
};

export const generateId = (prefix: string): string => {
  return `${prefix}-${Math.floor(Math.random() * 10000)}`;
};

export const getStoredMessages = (): Message[] => {
  const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
  return stored ? JSON.parse(stored) : [];
};

export const addMessage = (message: Message): void => {
  const messages = getStoredMessages();
  messages.push(message);
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  setDoc(doc(db, 'messages', message.id), message).catch(console.error);
};

export const markMessageAsRead = (messageId: string): void => {
  const messages = getStoredMessages();
  const index = messages.findIndex(m => m.id === messageId);
  if (index !== -1) {
    messages[index].read = true;
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    setDoc(doc(db, 'messages', messageId), messages[index]).catch(console.error);
  }
};

export const editMessage = (messageId: string, newContent: string): void => {
  const messages = getStoredMessages();
  const index = messages.findIndex(m => m.id === messageId);
  if (index !== -1) {
    messages[index].content = newContent;
    messages[index].isEdited = true;
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    setDoc(doc(db, 'messages', messageId), messages[index]).catch(console.error);
  }
};

export const deleteMessage = (messageId: string): void => {
  const messages = getStoredMessages();
  const filtered = messages.filter(m => m.id !== messageId);
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(filtered));
  deleteDoc(doc(db, 'messages', messageId)).catch(console.error);
};

export const getStoredPayments = (): import('../types').PaymentRecord[] => {
  const stored = localStorage.getItem(STORAGE_KEY_PAYMENTS);
  return stored ? JSON.parse(stored) : [];
};

export const addPayment = (payment: import('../types').PaymentRecord): void => {
  const payments = getStoredPayments();
  payments.push(payment);
  localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
  setDoc(doc(db, 'payments', payment.id), payment).catch(console.error);
};

export const deletePayment = (id: string): void => {
  let payments = getStoredPayments();
  payments = payments.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
  deleteDoc(doc(db, 'payments', id)).catch(console.error);
};

export const updatePayment = (updatedPayment: import('../types').PaymentRecord): void => {
  const payments = getStoredPayments();
  const index = payments.findIndex(p => p.id === updatedPayment.id);
  if (index !== -1) {
    payments[index] = updatedPayment;
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
    setDoc(doc(db, 'payments', updatedPayment.id), updatedPayment).catch(console.error);
  }
};