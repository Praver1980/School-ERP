const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, collectionGroup } = require('firebase/firestore');
require('dotenv').config();

const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
});

const db = getFirestore(app);

async function wipe() {
    try {
        console.log("Starting database wipe...");
        
        // 1. Wipe top-level collections
        const topLevel = ['announcements', 'assignments', 'messages', 'payments', 'students', 'schools', 'users'];
        for (const col of topLevel) {
            const snap = await getDocs(collection(db, col));
            let deletedCount = 0;
            for (const d of snap.docs) {
                // Keep the supreme admin untouched
                if (col === 'users' && d.id === 'u_admin') continue;
                if (d.data() && d.data().role === 'supreme_admin') continue;
                
                await deleteDoc(d.ref);
                deletedCount++;
            }
            console.log(`Deleted ${deletedCount} docs from ${col}`);
        }

        // 2. Wipe subcollections (from the tree structure)
        const subCollections = ['principals', 'teachers', 'students', 'admins'];
        for (const col of subCollections) {
            const snap = await getDocs(collectionGroup(db, col));
            let deletedCount = 0;
            for (const d of snap.docs) {
                if (d.data() && d.data().role === 'supreme_admin') continue;
                if (d.id.includes('u_admin')) continue;
                
                await deleteDoc(d.ref);
                deletedCount++;
            }
            console.log(`Deleted ${deletedCount} docs from collectionGroup ${col}`);
        }
        
        console.log("Wipe completed successfully.");
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
wipe();
