const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

const targetMethod = "  const handleWipeDatabase = async () => {";
const wipeMethod = `
  const handleWipeDatabase = async () => {
    setConfirmState({
      isOpen: true,
      title: 'FACTORY RESET DATABASE',
      message: 'Are you absolutely sure? This will delete ALL data (schools, staff, students, assignments, etc.). ONLY the Supreme Admin will remain. This action CANNOT be undone.',
      onConfirm: async () => {
        try {
          alert('Initiating database wipe (this may take a moment)...');
          
          const topLevel = ['announcements', 'assignments', 'messages', 'payments', 'students', 'schools', 'users'];
          const { collection, getDocs, deleteDoc, collectionGroup } = require('firebase/firestore');
          const { db } = require('../services/firebase');
          
          // Clear standard collections
          for (const col of topLevel) {
            const snap = await getDocs(collection(db, col));
            for (const d of snap.docs) {
              if (col === 'users' && d.id === 'u_admin') continue;
              if (d.data() && d.data().role === 'supreme_admin') continue;
              await deleteDoc(d.ref).catch(() => {});
            }
          }
          
          // Clear subcollections
          const subCollections = ['principals', 'teachers', 'students', 'admins'];
          for (const col of subCollections) {
            const snap = await getDocs(collectionGroup(db, col));
            for (const d of snap.docs) {
              if (d.data() && d.data().role === 'supreme_admin') continue;
              if (d.id.includes('u_admin')) continue;
              await deleteDoc(d.ref).catch(() => {});
            }
          }

          // Clear local storage completely, then restore just the admin
          localStorage.clear();
          const adminUser = users.find(u => u.role === UserRole.SUPREME_ADMIN);
          if (adminUser) {
            localStorage.setItem('nexus_erp_users_v2', JSON.stringify([adminUser]));
          }
          alert('Database wiped successfully. Refreshing...');
          window.location.reload();
        } catch (e) {
          console.error(e);
          alert('Error wiping database.');
        }
      }
    });
  };`;

// replace up to the next method
code = code.replace(/const handleWipeDatabase = async \(\) => \{[\s\S]*?const handleSendTelegramReport = async \(\) => \{/, wipeMethod + "\n\n  const handleSendTelegramReport = async () => {");

fs.writeFileSync('pages/AdminDashboard.tsx', code);
console.log("Patched AdminDashboard.tsx to do client-side wipe");
