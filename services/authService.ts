import { User as AppUser, UserRole } from '../types';
import { supabase } from './supabase';


const EMAIL_DOMAIN = 'v3.internal.schoolapp.com';

export const generateSyntheticEmail = (loginId: string): string => {
  const sanitizedID = loginId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const finalID = sanitizedID || 'USER' + Math.floor(Math.random() * 10000);
  return `${finalID.toLowerCase()}@${EMAIL_DOMAIN}`;
};

export const loginWithSchoolID = async (loginId: string, password: string): Promise<AppUser> => {
  const loginEmail = generateSyntheticEmail(loginId);
  const authPassword = password + "NEXUS_SALT_123";
  
  try {
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: authPassword
    });

    if (authError && authError.message.includes('Invalid login credentials')) {
      // 1. Verify credentials against public.users (or check if it's the bootstrap admin)
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_credentials', {
        p_login_id: loginId,
        p_password: password
      });

      if (verifyError) { throw new Error("Database not updated. Please run 02_security_audit_fixes.sql in Supabase SQL Editor. Details: " + verifyError.message); }
      if (!isValid) {
         throw new Error("Invalid School ID or Password.");
      }

      // 2. Safe to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: loginEmail,
        password: authPassword
      });
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('rate limit')) {
            throw new Error("Supabase Rate Limit: Please go to your Supabase Dashboard -> Authentication -> Providers -> Email, and turn OFF 'Confirm email'.");
        }
        if (signUpError.message.includes('User already registered')) {
            throw new Error("Invalid School ID or Password.");
        }
        throw signUpError;
      }
      authData = signUpData;
      
      if (!authData.session) {
         const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: authPassword
         });
         
         if (signInError) {
             throw new Error("Supabase Setup Required: Please ensure 'Confirm email' is turned OFF in Supabase Dashboard -> Authentication -> Providers -> Email.");
         }
         authData = signInData;
      }
      
      // 3. Link the new Auth user to the pre-created public.users record
      const { error: linkError } = await supabase.rpc('link_auth_user', {
        p_login_id: loginId,
        p_password: password
      });
      
      if (linkError) {
         console.error("Failed to link account:", linkError);
         await supabase.auth.signOut();
         throw new Error("Failed to link account. Please contact administrator.");
      }
    } else if (authError) {
        if (authError.message.toLowerCase().includes('rate limit') || authError.message.toLowerCase().includes('email not confirmed')) {
            throw new Error("Supabase Setup Required: Please go to your Supabase Dashboard -> Authentication -> Providers -> Email, and turn OFF 'Confirm email'.");
        }
       throw authError;
    }

    // Fetch user profile
    const { data: userDoc, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('uid', authData.user!.id)
      .single();

    if (userError || !userDoc) {
      // Attempt to link just in case it's an orphaned auth account from a previous failed signup
      const { error: linkError } = await supabase.rpc('link_auth_user', {
        p_login_id: loginId,
        p_password: password
      });
      
      if (!linkError) {
         const { data: retryUser, error: retryError } = await supabase
          .from('users')
          .select('*')
          .eq('uid', authData.user!.id)
          .single();
          
         if (!retryError && retryUser) {
             return retryUser as AppUser;
         }
      }

      await supabase.auth.signOut();
      throw new Error("User profile not found in database.");
    }

    return userDoc as AppUser;
  } catch (error: any) {
    console.error("Supabase Auth error:", error);
    if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid School ID')) {
      throw new Error("Invalid School ID or Password.");
    }
    throw new Error("Authentication failed: " + error.message);
  }
};

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};