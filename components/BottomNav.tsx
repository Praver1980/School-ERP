import React from 'react';
import { User, UserRole } from '../types';
import { getStoredMessages } from '../services/storage';
import { 
  LayoutDashboard, 
  GraduationCap, 
  ClipboardList, 
  MessageSquare, 
  Megaphone,
  Settings,
  BookOpen,
  ShieldAlert,
  Menu
} from 'lucide-react';

interface BottomNavProps {
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenSidebar: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  user,
  currentPage,
  onNavigate,
  onOpenSidebar
}) => {
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const updateUnread = () => {
      const messages = getStoredMessages();
      const count = messages.filter(m => m.receiverId === user.uid && !m.read).length;
      setUnreadCount(count);
    };
    updateUnread();
    const interval = setInterval(updateUnread, 5000);
    return () => clearInterval(interval);
  }, [user.uid]);

  const getPrimaryTabs = () => {
    if (user.role === UserRole.PRINCIPAL) {
      return [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'attendance', label: 'Attendance', icon: ClipboardList },
        { id: 'announcements', label: 'News', icon: Megaphone },
        { id: 'payments', label: 'Fees', icon: ClipboardList },
      ];
    }

    if (user.role === UserRole.TEACHER) {
      return [
        { id: 'dashboard', label: 'Roster', icon: LayoutDashboard },
        { id: 'grades', label: 'Grades', icon: GraduationCap },
        { id: 'assignments', label: 'Tasks', icon: ClipboardList },
        { id: 'messages', label: 'Chat', icon: MessageSquare, badge: unreadCount },
      ];
    }

    if (user.role === UserRole.STUDENT) {
      return [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'grades', label: 'Grades', icon: GraduationCap },
        { id: 'assignments', label: 'Tasks', icon: ClipboardList },
        { id: 'messages', label: 'Chat', icon: MessageSquare, badge: unreadCount },
      ];
    }

    if (user.role === UserRole.SUPREME_ADMIN) {
      return [
        { id: 'dashboard', label: 'Overview', icon: ShieldAlert },
        { id: 'payments', label: 'Payments', icon: ClipboardList },
        { id: 'db-management', label: 'DB', icon: Settings },
      ];
    }

    return [{ id: 'dashboard', label: 'Home', icon: LayoutDashboard }];
  };

  const tabs = getPrimaryTabs();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-all">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPage === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[56px] transition-all duration-200 active:scale-90 relative ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {/* Android Pill Indicator for active item */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'bg-transparent'
                }`}
              >
                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black px-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px] font-semibold">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More / Menu Drawer trigger */}
        <button
          onClick={onOpenSidebar}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[56px] text-slate-400 dark:text-slate-500 active:scale-90 transition-all"
        >
          <div className="px-4 py-1 rounded-full flex items-center justify-center">
            <Menu size={20} className="stroke-[1.8px]" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-semibold">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
