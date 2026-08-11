const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

const targetMethod = "  const handleSendTelegramReport = async () => {";
const wipeMethod = `
  const handleWipeDatabase = async () => {
    setConfirmState({
      isOpen: true,
      title: 'FACTORY RESET DATABASE',
      message: 'Are you absolutely sure? This will delete ALL data (schools, staff, students, assignments, etc.). ONLY the Supreme Admin will remain. This action CANNOT be undone.',
      onConfirm: async () => {
        try {
          alert('Initiating database wipe...');
          const res = await fetch('/api/wipe-database', { method: 'POST' });
          if (res.ok) {
            // Clear local storage completely, then restore just the admin
            localStorage.clear();
            const adminUser = users.find(u => u.role === UserRole.SUPREME_ADMIN);
            if (adminUser) {
              localStorage.setItem('nexus_erp_users_v2', JSON.stringify([adminUser]));
            }
            alert('Database wiped successfully. Refreshing...');
            window.location.reload();
          } else {
            alert('Failed to wipe database.');
          }
        } catch (e) {
          alert('Error wiping database.');
        }
      }
    });
  };

  const handleSendTelegramReport = async () => {`;

code = code.replace(targetMethod, wipeMethod);

const targetButton = `<h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Shield size={28} className="text-blue-500" /> Administrative Hub</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage all schools, principals, and system settings</p>
          </div>
          <button`;

const wipeButton = `<h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Shield size={28} className="text-blue-500" /> Administrative Hub</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage all schools, principals, and system settings</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleWipeDatabase}
              className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Trash size={18} /> Factory Reset Database
            </button>
            <button`;

code = code.replace(targetButton, wipeButton);

// Add Trash to imports
code = code.replace("Settings, Send } from 'lucide-react';", "Settings, Send, Trash } from 'lucide-react';");

fs.writeFileSync('pages/AdminDashboard.tsx', code);
console.log("Patched AdminDashboard.tsx with wipe button");
