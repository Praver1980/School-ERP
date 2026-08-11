-- 1. Modify users table to allow text uids and remove auth.users foreign key constraint
-- This allows Admins to pre-create users with placeholder UIDs before they sign up.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_uid_fkey;
ALTER TABLE public.users ALTER COLUMN uid TYPE TEXT;

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
    INSERT INTO public.users (uid, "loginId", name, role, "schoolName", "schoolID")
    VALUES (auth.uid()::TEXT, p_login_id, 'Supreme Admin', 'supreme_admin', 'Global Network', 'global')
    ON CONFLICT ("loginId") DO UPDATE SET uid = auth.uid()::TEXT;
    RETURN TRUE;
  END IF;

  SELECT * INTO v_user FROM public.users 
  WHERE "loginId" = p_login_id AND password = p_password;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Invalid credentials';
  END IF;

  UPDATE public.users 
  SET uid = auth.uid()::TEXT, password = NULL
  WHERE "loginId" = p_login_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix Users RLS Policy (Remove insecure UPDATE policy)
DROP POLICY IF EXISTS "Users can update their own non-critical profile fields" ON public.users;
CREATE POLICY "Users can update their own non-critical profile fields" ON public.users FOR UPDATE USING (uid = auth.uid());
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
  AND "studentId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid())
);

DROP POLICY IF EXISTS "Students can update own submissions" ON public.assignment_submissions;
CREATE POLICY "Students can update own submissions" ON public.assignment_submissions FOR UPDATE USING (
  public.get_auth_user_role() = 'student' 
  AND "schoolID" = public.get_auth_user_school_id()
  AND "studentId" = (SELECT "loginId" FROM public.users WHERE uid = auth.uid())
);

-- 8. Fix Message Content Modification IDOR
CREATE OR REPLACE FUNCTION public.protect_message_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_user_login TEXT;
BEGIN
  SELECT "loginId" INTO v_user_login FROM public.users WHERE uid = auth.uid();
  
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
