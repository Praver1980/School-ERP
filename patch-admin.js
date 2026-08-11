const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

// add import MonitoringDashboard from './MonitoringDashboard';
code = code.replace("import ConfirmModal from '../components/ConfirmModal';", "import ConfirmModal from '../components/ConfirmModal';\nimport MonitoringDashboard from './MonitoringDashboard';");

// add 'monitoring' to activeTab state
code = code.replace(/useState<'overview' \| 'principals' \| 'teachers' \| 'students' \| 'announcements' \| 'schools' \| 'assignments' \| 'payments'>\('overview'\)/, "useState<'overview' | 'principals' | 'teachers' | 'students' | 'announcements' | 'schools' | 'assignments' | 'payments' | 'monitoring'>('overview')");

// add 'Monitoring' button
const buttonHtml = `            <button onClick={() => setActiveTab('monitoring')} className={\`px-4 py-2 rounded-md text-sm font-medium flex gap-1 \${activeTab === 'monitoring' ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}\`}><Shield size={16} /> Monitor</button>`;
code = code.replace(/<CreditCard size=\{16\} \/> Payments<\/button>/, "<CreditCard size={16} /> Payments</button>\n" + buttonHtml);

// add the monitoring tab content
const contentHtml = `
      {/* MONITORING TAB */}
      {activeTab === 'monitoring' && (
        <MonitoringDashboard />
      )}
`;

code = code.replace("{/* OVERVIEW TAB */}", contentHtml + "\n      {/* OVERVIEW TAB */}");

fs.writeFileSync('pages/AdminDashboard.tsx', code);
console.log("Patched AdminDashboard");
