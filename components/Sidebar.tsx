import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { User, UserRole } from '../types';
import { getStoredMessages } from '../services/storage';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  GraduationCap,
  ShieldAlert,
  Megaphone,
  ClipboardList,
  X,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  onLogout, 
  currentPage, 
  onNavigate, 
  isOpen = false, 
  onClose,
  theme,
  toggleTheme
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnreadCount = () => {
      const messages = getStoredMessages();
      const count = messages.filter(m => m.receiverId === user.uid && !m.read).length;
      setUnreadCount(count);
    };

    updateUnreadCount();
    // Poll for new messages every 5 seconds
    const interval = setInterval(updateUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [user.uid]);
  
  const getMenuItems = () => {
    const common = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (user.role === UserRole.PRINCIPAL) {
      return [
        ...common,
        { id: 'attendance', label: 'Attendance', icon: ClipboardList },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'payments', label: 'Fee Payments', icon: ClipboardList },
        { id: 'settings', label: 'School Settings', icon: Settings },
      ];
    }
    
    if (user.role === UserRole.TEACHER) {
      return [
        { id: 'dashboard', label: 'Attendance & Roster', icon: LayoutDashboard },
        { id: 'grades', label: 'Student Grades', icon: GraduationCap },
        { id: 'assignments', label: 'Assignments', icon: ClipboardList },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'announcements', label: 'News & Events', icon: Megaphone },
      ];
    }

    if (user.role === UserRole.STUDENT) {
      return [
        ...common,
        { id: 'grades', label: 'My Grades', icon: GraduationCap },
        { id: 'assignments', label: 'Assignments', icon: ClipboardList },
        { id: 'teachers', label: 'My Teachers', icon: BookOpen },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'announcements', label: 'News & Events', icon: Megaphone },
      ];
    }

    if (user.role === UserRole.SUPREME_ADMIN) {
      return [
        { id: 'dashboard', label: 'System Overview', icon: ShieldAlert },
        { id: 'payments', label: 'Platform Payments', icon: ClipboardList },
        { id: 'db-management', label: 'DB Management', icon: Settings },
      ];
    }

    return common;
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`h-screen w-72 bg-slate-950 text-white flex flex-col fixed left-0 top-0 z-50 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:translate-x-0 border-r border-slate-900 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-slate-950 italic shadow-xl shadow-white/5 shrink-0 animate-float">
              N
            </div>
            <div>
              <h1 className="font-black text-xl leading-none tracking-tighter uppercase italic">Nexus</h1>
              <p className="text-label text-blue-500 mt-1">Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            {/* Close button for mobile */}
            <button onClick={onClose} className="md:hidden p-2.5 bg-slate-900 text-slate-400 hover:text-white rounded-2xl transition-all border border-slate-800">
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto scrollbar-hide">
          <div className="px-4 mb-4">
            <p className="text-label opacity-50">Main Menu</p>
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative ${
                  active 
                    ? 'bg-white text-slate-950 shadow-xl shadow-white/10' 
                    : 'text-slate-500 hover:bg-slate-900 hover:text-slate-100'
                }`}
              >
                <Icon size={20} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`font-black text-xs uppercase tracking-widest flex-1 text-left ${active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>{item.label}</span>
                {item.id === 'messages' && unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
                {active && item.id !== 'messages' && (
                  <div className="absolute right-4 w-1.5 h-1.5 bg-slate-950 rounded-full" />
                )}
                {active && item.id === 'messages' && unreadCount === 0 && (
                  <div className="absolute right-4 w-1.5 h-1.5 bg-slate-950 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-8 mt-auto">
          <div className="premium-card bg-slate-900 border-slate-800 p-5 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative shrink-0">
                <img 
                  src={user.avatarUrl} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-2xl bg-slate-800 object-cover border-2 border-slate-800 shadow-inner"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black truncate text-slate-100">{user.name}</p>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-red-500/10"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
          <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">v2.4.0 Premium</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;