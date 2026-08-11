const fs = require('fs');
let code = fs.readFileSync('pages/MonitoringDashboard.tsx', 'utf8');

// Update imports
code = code.replace("import { Activity, Server, Users, Zap, AlertTriangle, ShieldCheck, Cpu, HardDrive, Wifi } from 'lucide-react';", "import { Activity, Server, Users, Zap, AlertTriangle, ShieldCheck, Cpu, HardDrive, Wifi, Trash2 } from 'lucide-react';");

// Update interface and component definition
code = code.replace("const MonitoringDashboard: React.FC = () => {", `interface MonitoringDashboardProps {
  onFactoryReset?: () => void;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ onFactoryReset }) => {`);

// Add button in header
const targetHeader = `<div className={\`flex items-center gap-3 px-4 py-2 rounded-xl border \${data.activeAlerts > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'}\`}>`;

const resetBtn = `
        {onFactoryReset && (
          <button
            onClick={onFactoryReset}
            className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg transition-colors font-semibold shadow-lg shadow-red-500/30"
          >
            <Trash2 size={18} />
            FACTORY RESET DATABASE
          </button>
        )}
        <div className={\`flex items-center gap-3 px-4 py-2 rounded-xl border \${data.activeAlerts > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'}\`}>`;

code = code.replace(targetHeader, resetBtn);

fs.writeFileSync('pages/MonitoringDashboard.tsx', code);
console.log("Patched MonitoringDashboard.tsx");
