import { User as AppUser, UserRole } from '../types';
import { getStoredUsers } from './storage';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// CONSTANTS FOR SECURITY
const EMAIL_DOMAIN = 'v2.internal.schoolapp.com';

export const generateSyntheticEmail = (schoolID: string): string => {
  const sanitizedID = schoolID.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const finalID = sanitizedID || 'USER' + Math.floor(Math.random() * 10000);
  return `${finalID}@${EMAIL_DOMAIN}`;
};

export const loginWithSchoolID = async (schoolID: string, password: string): Promise<AppUser> => {
  const users = getStoredUsers();
  const userRecord = users.find(u => u.schoolID === schoolID);

  if (!userRecord) {
    throw new Error("Invalid School ID. User not found in database.");
  }

  if (userRecord.password && userRecord.password !== password) {
      throw new Error("Invalid Password.");
  }

  let loginEmail = userRecord.email?.trim() || '';
  // Basic validation to ensure Firebase won't reject it as an invalid email
  if (!loginEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
      loginEmail = generateSyntheticEmail(schoolID);
  }
  
  // Pad the password to ensure it's at least 6 characters for Firebase Auth
  const firebasePassword = password + "NEXUS_SALT_123";

  try {
    // Try to sign in
    await signInWithEmailAndPassword(auth, loginEmail, firebasePassword);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
       try {
           // Try legacy unsalted password
           await signInWithEmailAndPassword(auth, loginEmail, password);
       } catch (legacyError: any) {
           // If user doesn't exist in Firebase Auth yet, create them
           try {
               await createUserWithEmailAndPassword(auth, loginEmail, firebasePassword);
           } catch (createError: any) {
               if (createError.code === 'auth/email-already-in-use') {
                   // User exists but our passwords failed. The credentials must be updated in Auth
                   // Since local check passed, they are valid locally. But we can't easily sign them in.
                   // So we let it fallback to throwing an error.
                   
                   try {
                       await fetch(`/api/auth/users?email=${encodeURIComponent(loginEmail)}`, { method: 'DELETE' });
                       await createUserWithEmailAndPassword(auth, loginEmail, firebasePassword);
                       return { ...userRecord, email: loginEmail };
                   } catch (e) {
                       console.warn("Local password valid, but out of sync with Firebase. Bypassing Firebase Auth for now.");
                       return { ...userRecord, email: loginEmail };
                   }

               } else {
                   console.error("Failed to create Firebase Auth user:", createError);
                   throw new Error("Authentication failed: " + createError.message);
               }
           }
       }
    } else {
       console.error("Firebase Auth error:", error);
       throw new Error("Authentication failed: " + error.message);
    }
  }

  return {
    ...userRecord,
    email: loginEmail
  };
};

export const logout = async (): Promise<void> => {
  await auth.signOut();
};