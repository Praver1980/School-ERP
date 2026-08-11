import { User, UserRole, StudentRecord, Announcement, ERPDatabase, School, SchoolConfig, Assignment, Message } from '../types';
import { SCHOOL_NAMES } from '../constants';
import { collection, collectionGroup, doc, setDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

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
const STORAGE_KEY_SCHOOLS = 'nexus_erp_schools_v2'; // Version bump for config
const STORAGE_KEY_ASSIGNMENTS = 'nexus_erp_assignments_v1';
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
    schoolID: 'admin9945',
    name: 'System Administrator',
    role: UserRole.SUPREME_ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=System+Admin&background=10b981&color=fff',
    password: '201212'
  }
];


export const initializeFirebaseSync = async () => {
  const collections = [
    { name: 'announcements', key: STORAGE_KEY_ANNOUNCEMENTS },
    { name: 'schools', key: STORAGE_KEY_SCHOOLS },
    { name: 'assignments', key: STORAGE_KEY_ASSIGNMENTS },
    { name: 'messages', key: STORAGE_KEY_MESSAGES },
    { name: 'payments', key: STORAGE_KEY_PAYMENTS }
  ];

  const syncPromises = collections.map(col => {
    return new Promise<void>((resolve) => {
      onSnapshot(collection(db, col.name), async (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map(d => d.data());
          localStorage.setItem(col.key, JSON.stringify(data));
          window.dispatchEvent(new Event('nexus_data_changed'));
          resolve(); 
        } else {
          const localData = localStorage.getItem(col.key);
          if (localData) {
            const parsed = JSON.parse(localData);
            for (const item of parsed) {
              const id = item.uid || item.id;
              if (id) {
                await setDoc(doc(db, col.name, id), item).catch(console.error);
              }
            }
          }
          resolve();
        }
      }, (error) => {
        console.error(`Error syncing collection ${col.name}:`, error);
        resolve();
      });
    });
  });

  // Sync users and students from tree structure
  const userRoles = ['principals', 'teachers', 'admins', 'users'];
  let allUsers: any[] = [];
  let allStudents: any[] = [];

  const handleUsersUpdate = () => {
    if (allUsers.length > 0) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(allUsers));
      window.dispatchEvent(new Event('nexus_data_changed'));
    }
  };

  const rolePromises = userRoles.map(role => {
    return new Promise<void>((resolve) => {
      onSnapshot(collectionGroup(db, role), (snap) => {
        const newData = snap.docs.map(d => d.data());
        // Filter out existing users of this role, then add new ones
        allUsers = allUsers.filter(u => u.role !== role.replace('principals', 'principal').replace('teachers', 'teacher').replace('admins', 'supreme_admin').replace('users', 'student'));
        allUsers = [...allUsers, ...newData];
        
        // Remove duplicates just in case
        const uniqueUsers = Array.from(new Map(allUsers.map(item => [item.uid, item])).values());
        allUsers = uniqueUsers;
        
        handleUsersUpdate();
        resolve();
      }, (error) => {
        console.error(`Error syncing role ${role}:`, error);
        resolve();
      });
    });
  });

  const studentPromise = new Promise<void>((resolve) => {
    onSnapshot(collectionGroup(db, 'students'), (snap) => {
      allStudents = snap.docs.map(d => d.data());
      if (allStudents.length > 0) {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(allStudents));
        window.dispatchEvent(new Event('nexus_data_changed'));
      }
      resolve();
    }, (error) => {
      console.error('Error syncing students:', error);
      resolve();
    });
  });

  await Promise.all([...syncPromises, ...rolePromises, studentPromise]);
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
  setDoc(doc(db, 'schools', user.schoolID || 'global', getRoleCollection(user.role), recId), user).catch(console.error);
};

export const updateUser = (updatedUser: User): void => {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.uid === updatedUser.uid);
  if (index !== -1) {
    users[index] = updatedUser;
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    const recId = getRecognizableId(updatedUser.name, updatedUser.uid);
    setDoc(doc(db, 'schools', updatedUser.schoolID || 'global', getRoleCollection(updatedUser.role), recId), updatedUser).catch(console.error);
  }
};

export const removeUser = (uid: string): void => {
  let users = getStoredUsers();
  const userToDelete = users.find(u => u.uid === uid);
  users = users.filter(u => u.uid !== uid);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  
  if (userToDelete) {
    const recId = getRecognizableId(userToDelete.name, userToDelete.uid);
    deleteDoc(doc(db, 'schools', userToDelete.schoolID || 'global', getRoleCollection(userToDelete.role), recId)).catch(console.error);
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
  const teacher = getTeacherForStudent(student);
  if (teacher) {
    const teacherRecId = getRecognizableId(teacher.name, teacher.uid);
    setDoc(doc(db, 'schools', student.schoolID || 'global', 'teachers', teacherRecId, 'students', recId), student).catch(console.error);
  } else {
    setDoc(doc(db, 'schools', student.schoolID || 'global', 'students', recId), student).catch(console.error);
  }
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
    const teacher = getTeacherForStudent(updatedStudent);
    if (teacher) {
      const teacherRecId = getRecognizableId(teacher.name, teacher.uid);
      setDoc(doc(db, 'schools', updatedStudent.schoolID || 'global', 'teachers', teacherRecId, 'students', recId), updatedStudent).catch(console.error);
    } else {
      setDoc(doc(db, 'schools', updatedStudent.schoolID || 'global', 'students', recId), updatedStudent).catch(console.error);
    }
    
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
        const teacher = getTeacherForStudent(student);
        if (teacher) {
          const teacherRecId = getRecognizableId(teacher.name, teacher.uid);
          deleteDoc(doc(db, 'schools', student.schoolID || 'global', 'teachers', teacherRecId, 'students', recId)).catch(console.error);
        } else {
          deleteDoc(doc(db, 'schools', student.schoolID || 'global', 'students', recId)).catch(console.error);
        }
        deleteDoc(doc(db, 'students', studentId)).catch(console.error);
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
    const teacher = getTeacherForStudent(s);
    if (teacher) {
      const teacherRecId = getRecognizableId(teacher.name, teacher.uid);
      setDoc(doc(db, 'schools', s.schoolID || 'global', 'teachers', teacherRecId, 'students', recId), s).catch(console.error);
    } else {
      setDoc(doc(db, 'schools', s.schoolID || 'global', 'students', recId), s).catch(console.error);
    }
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
  return stored ? JSON.parse(stored) : [];
};

export const addAssignment = (assignment: Assignment): void => {
  const items = getStoredAssignments();
  items.unshift(assignment);
  localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(items));
  setDoc(doc(db, 'assignments', assignment.id), assignment).catch(console.error);
};

export const updateAssignment = (updatedAssignment: Assignment): void => {
  const items = getStoredAssignments();
  const index = items.findIndex(a => a.id === updatedAssignment.id);
  if (index !== -1) {
    items[index] = updatedAssignment;
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(items));
    setDoc(doc(db, 'assignments', updatedAssignment.id), updatedAssignment).catch(console.error);
  }
};

export const submitAssignment = (assignmentId: string, submission: import('../types').AssignmentSubmission): void => {
  const items = getStoredAssignments();
  const index = items.findIndex(a => a.id === assignmentId);
  if (index !== -1) {
    if (!items[index].submissions) {
      items[index].submissions = [];
    }
    // Remove previous submission by this student if any
    items[index].submissions = items[index].submissions!.filter(s => s.studentId !== submission.studentId);
    items[index].submissions!.push(submission);
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(items));
    setDoc(doc(db, 'assignments', assignmentId), items[index]).catch(console.error);
  }
};

export const updateSubmissionStatus = (
  assignmentId: string, 
  studentId: string, 
  teacherVerified: 'pending' | 'verified' | 'rejected', 
  completionStatus: 'pending' | 'complete' | 'incomplete'
): void => {
  const items = getStoredAssignments();
  const index = items.findIndex(a => a.id === assignmentId);
  if (index !== -1 && items[index].submissions) {
    const subIndex = items[index].submissions!.findIndex(s => s.studentId === studentId);
    if (subIndex !== -1) {
      items[index].submissions![subIndex].teacherVerified = teacherVerified;
      items[index].submissions![subIndex].completionStatus = completionStatus;
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(items));
      setDoc(doc(db, 'assignments', assignmentId), items[index]).catch(console.error);
    }
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
    
    const users = getStoredUsers().filter(u => u.schoolID === id);
    users.forEach(u => removeUser(u.uid));
    
    const students = getStoredStudents().filter(s => s.schoolID === id);
    students.forEach(s => removeStudent(s.id));
    
    const announcements = getStoredAnnouncements().filter(a => a.schoolName === school?.name);
    announcements.forEach(a => deleteAnnouncement(a.id));
    
    const assignments = getStoredAssignments().filter(a => a.schoolName === school?.name);
    assignments.forEach(a => deleteAssignment(a.id));
    
    const payments = getStoredPayments().filter(p => {
        // payments don't have schoolID directly, but we can match by principal's schoolID if needed
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