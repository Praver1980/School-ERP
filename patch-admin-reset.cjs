const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

// Insert State
const statePattern = "const [confirmState, setConfirmState] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });";
const resetStateStr = "\n  const [resetModal, setResetModal] = useState({ isOpen: false, step: 1, telOtp: '', emailOtp: '', pass: '', loading: false });\n";
code = code.replace(statePattern, statePattern + resetStateStr);

// Replace handleWipeDatabase
const wipeMethodRegex = /const handleWipeDatabase = async \(\) => \{[\s\S]*?const handleSendTelegramReport = async \(\) => \{/;

const newWipeMethod = `const handleWipeDatabase = async () => {
    setResetModal({ isOpen: true, step: 1, telOtp: '', emailOtp: '', pass: '', loading: false });
  };

  const executeFactoryReset = async () => {
    setResetModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/factory-reset/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramOtp: resetModal.telOtp,
          emailOtp: resetModal.emailOtp,
          masterPassword: resetModal.pass
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Reset failed');
        setResetModal(prev => ({ ...prev, loading: false }));
        return;
      }
      
      localStorage.clear();
      const adminUser = users.find(u => u.role === UserRole.SUPREME_ADMIN);
      if (adminUser) {
        localStorage.setItem('nexus_erp_users_v2', JSON.stringify([adminUser]));
      }
      
      alert('FACTORY RESET COMPLETE.\\n\\n' + data.message);
      window.location.reload();
    } catch (e) {
      alert('Server error executing reset.');
      setResetModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSendTelegramReport = async () => {`;

code = code.replace(wipeMethodRegex, newWipeMethod);

// Insert Factory Reset Modal before {showAddModal
const showAddModalPattern = "{showAddModal && (";

const factoryModalJsx = `
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-red-500/30">
            <div className="bg-red-50 dark:bg-red-900/30 p-6 border-b border-red-100 dark:border-red-900/50 text-center">
               <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-500 mx-auto mb-4" />
               <h2 className="text-2xl font-black text-red-700 dark:text-red-400 uppercase tracking-wider">Restricted Area</h2>
               <p className="text-red-600/80 dark:text-red-400/80 text-sm mt-2 font-medium">Multi-Factor Authentication Required</p>
            </div>
            <div className="p-6 space-y-6">
              {resetModal.step === 1 && (
                <div className="animate-fade-in text-center space-y-4">
                   <p className="text-slate-600 dark:text-slate-300 font-medium">
                     You are about to initiate a full system wipe. This requires 3-step verification.
                   </p>
                   <button 
                     onClick={async () => {
                       setResetModal(prev => ({...prev, loading: true}));
                       await fetch('/api/factory-reset/request-telegram', { method: 'POST' });
                       setResetModal(prev => ({...prev, loading: false, step: 2}));
                     }}
                     disabled={resetModal.loading}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                   >
                     {resetModal.loading ? 'Requesting...' : '1. Request Telegram OTP'}
                   </button>
                </div>
              )}

              {resetModal.step === 2 && (
                <div className="animate-fade-in space-y-4">
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Enter Telegram OTP</label>
                   <input type="text" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-center text-2xl tracking-[0.5em] font-mono" 
                          value={resetModal.telOtp} onChange={e => setResetModal(prev => ({...prev, telOtp: e.target.value}))} />
                   
                   <button 
                     onClick={async () => {
                       if (!resetModal.telOtp) return alert('Enter OTP');
                       setResetModal(prev => ({...prev, loading: true}));
                       await fetch('/api/factory-reset/request-email', { method: 'POST' });
                       setResetModal(prev => ({...prev, loading: false, step: 3}));
                     }}
                     disabled={resetModal.loading}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-all"
                   >
                     {resetModal.loading ? 'Verifying...' : 'Next: Request Email OTP'}
                   </button>
                </div>
              )}

              {resetModal.step === 3 && (
                <div className="animate-fade-in space-y-4">
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Enter Email OTP</label>
                   <input type="text" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-center text-2xl tracking-[0.5em] font-mono" 
                          value={resetModal.emailOtp} onChange={e => setResetModal(prev => ({...prev, emailOtp: e.target.value}))} />
                   
                   <button 
                     onClick={() => {
                       if (!resetModal.emailOtp) return alert('Enter OTP');
                       setResetModal(prev => ({...prev, step: 4}));
                     }}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-all"
                   >
                     Next: Master Password
                   </button>
                </div>
              )}

              {resetModal.step === 4 && (
                <div className="animate-fade-in space-y-4">
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Enter Master Secret Password</label>
                   <input type="password" className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-center text-xl font-mono" 
                          value={resetModal.pass} onChange={e => setResetModal(prev => ({...prev, pass: e.target.value}))} />
                   
                   <button 
                     onClick={executeFactoryReset}
                     disabled={resetModal.loading}
                     className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/30"
                   >
                     {resetModal.loading ? 'EXECUTING WIPE...' : 'EXECUTE FACTORY RESET'}
                   </button>
                </div>
              )}

              <button 
                onClick={() => setResetModal({ isOpen: false, step: 1, telOtp: '', emailOtp: '', pass: '', loading: false })}
                className="w-full text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors mt-4"
              >
                Cancel & Abort
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showAddModal && (`;

code = code.replace(showAddModalPattern, factoryModalJsx);

fs.writeFileSync('pages/AdminDashboard.tsx', code);
console.log("Patched AdminDashboard.tsx with multi-step auth");
