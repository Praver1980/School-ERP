
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PRINCIPAL = 'principal',
  SUPREME_ADMIN = 'supreme_admin',
}

export type HouseTeam = string;

export interface SchoolConfig {
  maxMarks: number;
  houseNames: string[];
  streams: string[]; // Available streams for senior classes
}

export interface School {
  id: string;
  name: string;
  config: SchoolConfig;
}

export interface TeachingAssignment {
  className: string;
  subject: string;
}

export interface User {
  uid: string;
  schoolID: string;
  name: string;
  role: UserRole;
  email?: string; 
  contactNumber?: string; // New: Contact number for Teachers/Staff
  avatarUrl?: string;
  className?: string; 
  password?: string; 
  assignedClass?: string; 
  assignedSubject?: string; 
  additionalClasses?: TeachingAssignment[]; // New: Sub classes and subjects
  gender?: string; 
  dob?: string;
  designation?: string; 
  house?: HouseTeam;
  schoolName?: string; // New: Assigned School
}

export interface MarkEntry {
  subject: string;
  midTerm: number;
  final: number;
}

export interface StudentRecord {
  id: string;
  name: string;
  schoolID: string;
  rollNumber: number;
  attendanceToday: boolean | null; 
  attendanceHistory?: { [date: string]: boolean }; // New: 'YYYY-MM-DD': true (Present) | false (Absent)
  gradeAverage: number;
  className: string;
  age?: number;
  dob?: string;
  gender?: string; 
  email?: string;
  fatherContact?: string;
  motherContact?: string;
  marks?: MarkEntry[];
  house?: HouseTeam; 
  studentPost?: string;
  schoolName?: string; // New: Assigned School
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  audience: 'all' | 'student' | 'teacher';
  author: string;
  schoolName?: string; // New: If undefined/null, it is visible to ALL schools (Global)
}

export interface AssignmentSubmission {
  studentId: string;
  studentName: string;
  submittedAt: string;
  fileData?: string; // Base64 encoded file data
  fileName?: string;
  isOffline?: boolean;
  teacherVerified?: 'pending' | 'verified' | 'rejected';
  completionStatus?: 'pending' | 'complete' | 'incomplete';
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  content: string;
  dueDate: string;
  targetClass: string; // e.g., "10th-A"
  schoolName: string;
  authorName: string;
  teacherUid: string;
  createdAt: string;
  submissions?: AssignmentSubmission[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: string;
  read: boolean;
  isEdited?: boolean;
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
}

export interface PaymentRecord {
  id: string;
  schoolName: string;
  principalUid: string;
  principalName: string;
  amount: number; // calculated at Rs 2 per student
  studentCount: number;
  date: string;
  transactionId: string;
  senderUpiId?: string;
  status: 'pending' | 'success' | 'failed';
}

export interface AttendanceStat {
  day: string;
  present: number;
  absent: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ERPDatabase {
  users: User[];
  students: StudentRecord[];
  announcements: Announcement[];
  schools: School[];
  assignments: Assignment[];
  messages: Message[];
  payments: PaymentRecord[];
}

export interface CloudConfig {
  clientId: string;
  enabled: boolean;
}
