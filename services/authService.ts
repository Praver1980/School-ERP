import { User as AppUser, UserRole } from '../types';
import { supabase } from './supabase';


const EMAIL_DOMAIN = 'v2.internal.schoolapp.com';

export const generateSyntheticEmail = (loginId: string): string => {
  const sanitizedID = loginId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const finalID = sanitizedID || 'USER' + Math.floor(Math.random() * 10000);
  return `${finalID}@${EMAIL_DOMAIN}`;
};

export const loginWithSchoolID = async (loginId: string, password: string): Promise<AppUser> => {
  const loginEmail = generateSyntheticEmail(loginId);
  const authPassword = password + "NEXUS_SALT_123";
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: authPassword
    });

    if (authError) throw authError;

    // Fetch user profile
    const { data: userDoc, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('uid', authData.user.id)
      .single();

    if (userError || !userDoc) {
      await supabase.auth.signOut();
      throw new Error("User profile not found in database.");
    }

    return userDoc as AppUser;
  } catch (error: any) {
    console.error("Supabase Auth error:", error);
    if (error.message.includes('Invalid login credentials')) {
      throw new Error("Invalid School ID or Password.");
    }
    throw new Error("Authentication failed: " + error.message);
  }
};

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};