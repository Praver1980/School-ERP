-- SCHOOL ERP SUPABASE SCHEMA & RLS MIGRATION

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running (Be careful with this in production!)
-- DROP TABLE IF EXISTS public.payments, public.messages, public.assignment_submissions, public.assignments, public.announcements, public.students, public.users, public.schools CASCADE;

-- 3. Create Tables
CREATE TABLE public.schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "loginId" TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'principal', 'supreme_admin')),
  email TEXT,
  "contactNumber" TEXT,
  "avatarUrl" TEXT,
  "className" TEXT,
  "assignedClass" TEXT,
  "assignedSubject" TEXT,
  "additionalClasses" JSONB DEFAULT '[]'::jsonb,
  gender TEXT,
  dob TEXT,
  designation TEXT,
  house TEXT,
  "schoolName" TEXT,
  "schoolID" TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  password TEXT -- ONLY FOR MIGRATION PURPOSES. Do not store actual passwords here in production.
);

CREATE TABLE public.students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "loginId" TEXT NOT NULL UNIQUE,
  "rollNumber" INTEGER,
  "attendanceToday" BOOLEAN,
  "attendanceHistory" JSONB DEFAULT '{}'::jsonb,
  "gradeAverage" NUMERIC,
  "className" TEXT,
  age INTEGER,
  dob TEXT,
  gender TEXT,
  email TEXT,
  "fatherContact" TEXT,
  "motherContact" TEXT,
  marks JSONB DEFAULT '[]'::jsonb,
  house TEXT,
  "studentPost" TEXT,
  "schoolName" TEXT,
  "schoolID" TEXT REFERENCES public.schools(id) ON DELETE CASCADE
);

CREATE TABLE public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('all', 'student', 'teacher')),
  author TEXT NOT NULL,
  "schoolName" TEXT,
  "schoolID" TEXT REFERENCES public.schools(id) ON DELETE CASCADE
);

CREATE TABLE public.assignments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  "dueDate" TEXT NOT NULL,
  "targetClass" TEXT NOT NULL,
  "schoolName" TEXT NOT NULL,
  "schoolID" TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  "authorName" TEXT NOT NULL,
  "teacherUid" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE public.assignment_submissions (
  id TEXT PRIMARY KEY,
  "assignmentId" TEXT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  "schoolID" TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES public.students("loginId") ON DELETE CASCADE,
  "studentName" TEXT NOT NULL,
  "submittedAt" TEXT NOT NULL,
  "fileData" TEXT,
  "fileName" TEXT,
  "isOffline" BOOLEAN DEFAULT false,
  "teacherVerified" TEXT CHECK ("teacherVerified" IN ('pending', 'verified', 'rejected')),
  "completionStatus" TEXT CHECK ("completionStatus" IN ('pending', 'complete', 'incomplete'))
);

CREATE TABLE public.messages (
  id TEXT PRIMARY KEY,
  "senderId" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "receiverName" TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  "isEdited" BOOLEAN DEFAULT false,
  attachment JSONB
);

CREATE TABLE public.payments (
  id TEXT PRIMARY KEY,
  "schoolName" TEXT NOT NULL,
  "schoolID" TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  "principalUid" TEXT NOT NULL,
  "principalName" TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  "studentCount" INTEGER NOT NULL,
  date TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "senderUpiId" TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed'))
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE uid = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_user_school_id()
RETURNS TEXT AS $$
  SELECT "schoolID" FROM public.users WHERE uid = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. RLS Policies

-- Users Table
CREATE POLICY "Supreme admins can read all users" ON public.users FOR SELECT USING (public.get_auth_user_role() = 'supreme_admin');
CREATE POLICY "Users can read their own profile" ON public.users FOR SELECT USING (uid = auth.uid());
CREATE POLICY "Principals can read users in their school" ON public.users FOR SELECT USING (public.get_auth_user_role() = 'principal' AND "schoolID" = public.get_auth_user_school_id());
CREATE POLICY "Teachers can read users in their school" ON public.users FOR SELECT USING (public.get_auth_user_role() = 'teacher' AND "schoolID" = public.get_auth_user_school_id());

CREATE POLICY "Supreme admins can manage all users" ON public.users FOR ALL USING (public.get_auth_user_role() = 'supreme_admin');
CREATE POLICY "Principals can manage users in their school" ON public.users FOR ALL USING (public.get_auth_user_role() = 'principal' AND "schoolID" = public.get_auth_user_school_id());
CREATE POLICY "Users can update their own non-critical profile fields" ON public.users FOR UPDATE USING (uid = auth.uid());

-- Schools Table
CREATE POLICY "Anyone can read schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Supreme admins can manage schools" ON public.schools FOR ALL USING (public.get_auth_user_role() = 'supreme_admin');

-- Students Table
CREATE POLICY "Users can read students in their school" ON public.students FOR SELECT USING (
  public.get_auth_user_role() = 'supreme_admin' OR
  "schoolID" = public.get_auth_user_school_id()
);
CREATE POLICY "Supreme admins can manage all students" ON public.students FOR ALL USING (public.get_auth_user_role() = 'supreme_admin');
CREATE POLICY "Principals can manage students in their school" ON public.students FOR ALL USING (public.get_auth_user_role() = 'principal' AND "schoolID" = public.get_auth_user_school_id());
CREATE POLICY "Teachers can manage students in their school" ON public.students FOR ALL USING (public.get_auth_user_role() = 'teacher' AND "schoolID" = public.get_auth_user_school_id());

-- Announcements Table
CREATE POLICY "Users can read announcements in their school" ON public.announcements FOR SELECT USING (
  public.get_auth_user_role() = 'supreme_admin' OR
  "schoolID" = public.get_auth_user_school_id()
);
CREATE POLICY "Staff can manage announcements in their school" ON public.announcements FOR ALL USING (
  public.get_auth_user_role() = 'supreme_admin' OR
  ((public.get_auth_user_role() = 'principal' OR public.get_auth_user_role() = 'teacher') AND "schoolID" = public.get_auth_user_school_id())
);

-- Assignments
CREATE POLICY "Users can read assignments in their school" ON public.assignments FOR SELECT USING (
  public.get_auth_user_role() = 'supreme_admin' OR
  "schoolID" = public.get_auth_user_school_id()
);
CREATE POLICY "Teachers can manage assignments in their school" ON public.assignments FOR ALL USING (
  public.get_auth_user_role() = 'supreme_admin' OR
  (public.get_auth_user_role() = 'teacher' AND "schoolID" = public.get_auth_user_school_id())
);

-- Submissions
CREATE POLICY "Users can read submissions in their school" ON public.assignment_submissions FOR SELECT USING (
  public.get_auth_user_role() = 'supreme_admin' OR
  "schoolID" = public.get_auth_user_school_id()
);
CREATE POLICY "Students can insert own submissions" ON public.assignment_submissions FOR INSERT WITH CHECK (
  public.get_auth_user_role() = 'student' AND "schoolID" = public.get_auth_user_school_id()
);
CREATE POLICY "Students can update own submissions" ON public.assignment_submissions FOR UPDATE USING (
  public.get_auth_user_role() = 'student' AND "schoolID" = public.get_auth_user_school_id()
);
CREATE POLICY "Teachers can manage submissions in their school" ON public.assignment_submissions FOR ALL USING (
  public.get_auth_user_role() = 'teacher' AND "schoolID" = public.get_auth_user_school_id()
);
CREATE POLICY "Principals can manage submissions in their school" ON public.assignment_submissions FOR ALL USING (
  public.get_auth_user_role() = 'principal' AND "schoolID" = public.get_auth_user_school_id()
);

-- Messages
CREATE POLICY "Users can read own messages" ON public.messages FOR SELECT USING (
  "senderId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid()) OR
  "receiverId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid())
);
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (
  "senderId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid())
);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (
  "senderId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid()) OR
  "receiverId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid())
);

-- Payments
CREATE POLICY "Principals can read payments in their school" ON public.payments FOR SELECT USING (
  public.get_auth_user_role() = 'supreme_admin' OR
  (public.get_auth_user_role() = 'principal' AND "schoolID" = public.get_auth_user_school_id())
);
CREATE POLICY "Principals can manage payments in their school" ON public.payments FOR ALL USING (
  public.get_auth_user_role() = 'supreme_admin' OR
  (public.get_auth_user_role() = 'principal' AND "schoolID" = public.get_auth_user_school_id())
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_users_school ON public.users("schoolID");
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students("schoolID");
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students("className", "schoolID");
CREATE INDEX IF NOT EXISTS idx_assignments_school ON public.assignments("schoolID");
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions("assignmentId");
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages("receiverId");
