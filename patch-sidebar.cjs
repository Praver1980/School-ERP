const fs = require('fs');
let code = fs.readFileSync('components/Sidebar.tsx', 'utf8');

const targetStr = `        </div>
        
        {/* User Profile */}`;

const careBlock = `        </div>
        
        {/* Customer Care */}
        {(user.role === UserRole.PRINCIPAL || user.role === UserRole.TEACHER) && (
          <div className="mx-6 mb-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Support Services</h4>
            <div className="space-y-2">
              <div className="text-xs">
                <span className="block text-slate-500 font-medium text-[10px] uppercase">3pm - 5pm</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{import.meta.env.VITE_SUPPORT_PHONE_1 || '7599337074'}</span>
                <span className="block text-slate-600 dark:text-slate-400 truncate">{import.meta.env.VITE_SUPPORT_EMAIL_1 || 'praver.agarwal7@gmail.com'}</span>
              </div>
              <div className="border-t border-blue-200/50 dark:border-blue-800/50 pt-2 text-xs">
                <span className="block text-slate-500 font-medium text-[10px] uppercase">5pm - 7pm</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{import.meta.env.VITE_SUPPORT_PHONE_2 || '79832 22450'}</span>
                <span className="block text-slate-600 dark:text-slate-400 truncate">{import.meta.env.VITE_SUPPORT_EMAIL_2 || 'Pending Email'}</span>
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}`;

code = code.replace(targetStr, careBlock);
fs.writeFileSync('components/Sidebar.tsx', code);
console.log("Patched Sidebar.tsx");
