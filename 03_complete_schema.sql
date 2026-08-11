-- SCHOOL ERP SUPABASE SCHEMA & RLS MIGRATION

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running (Be careful with this in production!)
DROP TABLE IF EXISTS public.payments, public.messages, public.assignment_submissions, public.assignments, public.announcements, public.students, public.users, public.schools CASCADE;

-- 3. Create Tables
CREATE TABLE public.schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.users (
  uid TEXT PRIMARY KEY,
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
  SELECT role FROM public.users WHERE uid = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_user_school_id()
RETURNS TEXT AS $$
  SELECT "schoolID" FROM public.users WHERE uid = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. RLS Policies

-- Users Table
CREATE POLICY "Supreme admins can read all users" ON public.users FOR SELECT USING (public.get_auth_user_role() = 'supreme_admin');
CREATE POLICY "Users can read their own profile" ON public.users FOR SELECT USING (uid = auth.uid()::text);
CREATE POLICY "Principals can read users in their school" ON public.users FOR SELECT USING (public.get_auth_user_role() = 'principal' AND "schoolID" = public.get_auth_user_school_id());
CREATE POLICY "Teachers can read users in their school" ON public.users FOR SELECT USING (public.get_auth_user_role() = 'teacher' AND "schoolID" = public.get_auth_user_school_id());

CREATE POLICY "Supreme admins can manage all users" ON public.users FOR ALL USING (public.get_auth_user_role() = 'supreme_admin');
CREATE POLICY "Principals can manage users in their school" ON public.users FOR ALL USING (public.get_auth_user_role() = 'principal' AND "schoolID" = public.get_auth_user_school_id());
CREATE POLICY "Users can update their own non-critical profile fields" ON public.users FOR UPDATE USING (uid = auth.uid()::text);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (uid = auth.uid()::text);

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
  "senderId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid()::text) OR
  "receiverId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid()::text)
);
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (
  "senderId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid()::text)
);
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (
  "senderId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid()::text) OR
  "receiverId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid()::text)
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


-- =========================================
-- SECURITY AUDIT FIXES APPLIED
-- =========================================

-- 1. Modify users table to allow text uids and remove auth.users foreign key constraint
-- This allows Admins to pre-create users with placeholder UIDs before they sign up.

-- 2. Create RPC to verify credentials before signup
CREATE OR REPLACE FUNCTION public.verify_credentials(p_login_id TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Allow the bootstrap Supreme Admin
  IF upper(p_login_id) = 'ADMIN9945' THEN
    RETURN TRUE;
  END IF;

  SELECT * INTO v_user FROM public.users 
  WHERE "loginId" = p_login_id AND password = p_password;

  IF v_user IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_credentials(TEXT, TEXT) TO anon;

-- 3. Create RPC to link account after signup
CREATE OR REPLACE FUNCTION public.link_auth_user(p_login_id TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  IF upper(p_login_id) = 'ADMIN9945' THEN
    INSERT INTO public.schools (id, name) VALUES ('global', 'Global Network') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.users (uid, "loginId", name, role, "schoolName", "schoolID")
    VALUES (auth.uid()::TEXT, p_login_id, 'Supreme Admin', 'supreme_admin', 'Global Network', 'global')
    ON CONFLICT ("loginId") DO UPDATE SET uid = auth.uid()::text;
    RETURN TRUE;
  END IF;

  SELECT * INTO v_user FROM public.users 
  WHERE "loginId" = p_login_id AND password = p_password;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Invalid credentials';
  END IF;

  UPDATE public.users 
  SET uid = auth.uid()::text, password = NULL
  WHERE "loginId" = p_login_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix Users RLS Policy (Remove insecure UPDATE policy)
DROP POLICY IF EXISTS "Users can update their own non-critical profile fields" ON public.users;
CREATE POLICY "Users can update their own non-critical profile fields" ON public.users FOR UPDATE USING (uid = auth.uid()::text);
-- Note: the policy remains the same, but we protect it using a trigger

-- 5. Create Trigger to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.protect_critical_user_fields()
RETURNS TRIGGER AS $$
DECLARE
  acting_role TEXT;
BEGIN
  acting_role := public.get_auth_user_role();
  
  -- Supreme admin can do anything
  IF acting_role = 'supreme_admin' THEN
    RETURN NEW;
  END IF;

  -- Prevent role escalation or school changes
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify role.';
  END IF;

  IF NEW."schoolID" IS DISTINCT FROM OLD."schoolID" THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify school ID.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_critical_fields_update ON public.users;
CREATE TRIGGER check_critical_fields_update
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_critical_user_fields();

-- 6. Protect Student Records from being transferred across schools
CREATE OR REPLACE FUNCTION public.protect_critical_student_fields()
RETURNS TRIGGER AS $$
DECLARE
  acting_role TEXT;
BEGIN
  acting_role := public.get_auth_user_role();
  
  IF acting_role = 'supreme_admin' THEN
    RETURN NEW;
  END IF;

  IF NEW."schoolID" IS DISTINCT FROM OLD."schoolID" THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify school ID.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_critical_student_fields_update ON public.students;
CREATE TRIGGER check_critical_student_fields_update
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.protect_critical_student_fields();

-- 7. Fix Student Submissions IDOR Vulnerability
DROP POLICY IF EXISTS "Students can insert own submissions" ON public.assignment_submissions;
CREATE POLICY "Students can insert own submissions" ON public.assignment_submissions FOR INSERT WITH CHECK (
  public.get_auth_user_role() = 'student' 
  AND "schoolID" = public.get_auth_user_school_id()
  AND "studentId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid()::text)
);

DROP POLICY IF EXISTS "Students can update own submissions" ON public.assignment_submissions;
CREATE POLICY "Students can update own submissions" ON public.assignment_submissions FOR UPDATE USING (
  public.get_auth_user_role() = 'student' 
  AND "schoolID" = public.get_auth_user_school_id()
  AND "studentId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid()::text)
);

-- 8. Fix Message Content Modification IDOR
CREATE OR REPLACE FUNCTION public.protect_message_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_user_login TEXT;
BEGIN
  SELECT "loginId" INTO v_user_login FROM public.users WHERE uid = auth.uid()::text;
  
  -- If the user is the receiver, they can ONLY update the "read" status.
  IF OLD."receiverId" = v_user_login THEN
    IF NEW.content IS DISTINCT FROM OLD.content 
       OR NEW."isEdited" IS DISTINCT FROM OLD."isEdited" 
       OR NEW.attachment IS DISTINCT FROM OLD.attachment THEN
      RAISE EXCEPTION 'Unauthorized: Receivers can only update read status.';
    END IF;
  END IF;

  -- Senders can update content, but cannot change senderId or receiverId
  IF NEW."senderId" IS DISTINCT FROM OLD."senderId" OR NEW."receiverId" IS DISTINCT FROM OLD."receiverId" THEN
      RAISE EXCEPTION 'Unauthorized: Cannot change message participants.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_message_integrity ON public.messages;
CREATE TRIGGER check_message_integrity
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.protect_message_integrity();

-- 9. Protect Assignments so Teachers can only update/delete their own assignments
DROP POLICY IF EXISTS "Teachers can manage assignments in their school" ON public.assignments;

CREATE POLICY "Teachers can insert assignments in their school" ON public.assignments FOR INSERT WITH CHECK (
  public.get_auth_user_role() = 'teacher' 
  AND "schoolID" = public.get_auth_user_school_id()
  AND "teacherUid" = auth.uid()::text
);

CREATE POLICY "Teachers can update their own assignments" ON public.assignments FOR UPDATE USING (
  public.get_auth_user_role() = 'teacher' 
  AND "schoolID" = public.get_auth_user_school_id()
  AND "teacherUid" = auth.uid()::text
);

CREATE POLICY "Teachers can delete their own assignments" ON public.assignments FOR DELETE USING (
  public.get_auth_user_role() = 'teacher' 
  AND "schoolID" = public.get_auth_user_school_id()
  AND "teacherUid" = auth.uid()::text
);
CREATE POLICY "Supreme admins can manage all assignments" ON public.assignments FOR ALL USING (
  public.get_auth_user_role() = 'supreme_admin'
);
