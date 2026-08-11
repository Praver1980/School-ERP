import React, { useEffect, useState } from 'react';
import { Activity, Server, Users, Zap, AlertTriangle, ShieldCheck, Cpu, HardDrive, Wifi, Trash2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface MonitoringData {
  uptime: string;
  activeUsers: number;
  avgResponseTime: string;
  activeAlerts: number;
  history: Array<{
    time: string;
    requests: number;
    cpu: number;
    memory: number;
  }>;
  system: {
    databaseStatus: string;
    authStatus: string;
    storageStatus: string;
    cpuModel: string;
    totalMem: string;
    freeMem: string;
  };
}

interface MonitoringDashboardProps {
  onFactoryReset?: () => void;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ onFactoryReset }) => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/monitoring');
        if (!response.ok) {
          const text = await response.text();
          console.error('Monitoring fetch failed:', text);
          return;
        }
        const json = await response.json();
        setData(json);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch monitoring data", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin text-blue-500">
           <Activity size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-3">
            <Activity className="text-blue-500" size={32} />
            System Monitoring
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Real-time analytics, performance metrics, and system health.
          </p>
        </div>
        
        {onFactoryReset && (
          <button
            onClick={onFactoryReset}
            className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg transition-colors font-semibold shadow-lg shadow-red-500/30"
          >
            <Trash2 size={18} />
            FACTORY RESET DATABASE
          </button>
        )}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${data.activeAlerts > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'}`}>
          {data.activeAlerts > 0 ? (
            <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
          ) : (
            <ShieldCheck className="text-green-600 dark:text-green-400" size={20} />
          )}
          <span className={`${data.activeAlerts > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'} font-bold uppercase tracking-wider text-sm`}>
            {data.activeAlerts > 0 ? 'System Warning' : 'System Healthy'}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Users className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Total Requests</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{data.activeUsers}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <Server className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Uptime</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{data.uptime}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <Zap className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Avg Response Time</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{data.avgResponseTime}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Active Alerts</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{data.activeAlerts}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Traffic Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Network Traffic</h3>
              <p className="text-sm text-slate-500">Requests (Live)</p>
            </div>
            <Wifi className="text-slate-400" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Server Load Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Resource Usage</h3>
              <p className="text-sm text-slate-500">CPU & Memory Allocation (%)</p>
            </div>
            <Cpu className="text-slate-400" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="memory" name="Memory %" stroke="#f59e0b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Services Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Services</h3>
            <HardDrive className="text-slate-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
            <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Database Engine</span>
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </div>
                <p className="text-xs text-slate-500">Status: {data.system.databaseStatus}</p>
            </div>
            <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Auth Service</span>
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </div>
                <p className="text-xs text-slate-500">Status: {data.system.authStatus}</p>
            </div>
            <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">System Info</span>
                </div>
                <p className="text-xs text-slate-500">{data.system.cpuModel}</p>
                <p className="text-xs text-slate-500">Mem: {data.system.freeMem} / {data.system.totalMem}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
