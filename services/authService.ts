import { User as AppUser, UserRole } from '../types';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const EMAIL_DOMAIN = 'v2.internal.schoolapp.com';

export const generateSyntheticEmail = (schoolID: string): string => {
  const sanitizedID = schoolID.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const finalID = sanitizedID || 'USER' + Math.floor(Math.random() * 10000);
  return `${finalID}@${EMAIL_DOMAIN}`;
};

export const loginWithSchoolID = async (schoolID: string, password: string): Promise<AppUser> => {
  const loginEmail = generateSyntheticEmail(schoolID);
  const firebasePassword = password + "NEXUS_SALT_123";

  try {
    const userCredential = await signInWithEmailAndPassword(auth, loginEmail, firebasePassword);
    
    // Fetch user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error("User profile not found in database.");
    }
    
    return userDoc.data() as AppUser;
  } catch (error: any) {
    console.error("Firebase Auth error:", error);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error("Invalid School ID or Password.");
    }
    throw new Error("Authentication failed: " + error.message);
  }
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};