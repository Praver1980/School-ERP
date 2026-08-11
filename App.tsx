import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import AnonymousPreview from './pages/AnonymousPreview';
import PrincipalDashboard from './pages/PrincipalDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import DeviceBadge from './components/DeviceBadge';
import ThemeToggle from './components/ThemeToggle';
import { User, UserRole } from './types';
import { logout } from './services/authService';
import { Menu } from 'lucide-react';


import { supabase } from './services/supabase';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('nexus_theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      try {
        if (user) {
          const { data: userDoc } = await supabase.from('users').select('*').eq('uid', user.id).single();
          if (userDoc) {
            setUser(userDoc as User);
            const { initializeSupabaseSync } = await import('./services/storage');
            await initializeSupabaseSync(userDoc as User);
          } else {
            console.warn("User profile not found in Supabase.");
            setUser(null);
            await logout();
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setIsSidebarOpen(false); // Close sidebar on mobile when navigating
  };

  const renderDashboard = () => {
    if (!user) return null;

    if (user.role === UserRole.SUPREME_ADMIN) {
        return <AdminDashboard currentPage={currentPage} />;
    }

    switch (user.role) {
      case UserRole.PRINCIPAL:
        return <PrincipalDashboard currentPage={currentPage} />;
      case UserRole.TEACHER:
        return <TeacherDashboard currentPage={currentPage} currentUser={user} />;
      case UserRole.STUDENT:
        return <StudentDashboard user={user} currentPage={currentPage} />;
      default:
        return <div className="p-8">Role not supported yet.</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-label animate-pulse">Initializing Nexus ERP</p>
      </div>
    );
  }

  if (showPreview) {
    return <AnonymousPreview onBack={() => setShowPreview(false)} />;
  }

  if (!user) {
    return <Login onLoginSuccess={handleLogin} onShowPreview={() => setShowPreview(true)} />;
  }

  // Ghost Admin Layout Override
  if (user.role === UserRole.SUPREME_ADMIN) {
      return (
          <div className="bg-slate-50 dark:bg-slate-950 min-h-[100dvh] font-sans text-base transition-colors duration-200 pb-20 md:pb-8">
             <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center shadow-xs sticky top-0 z-50">
                 <div className="flex items-center gap-3">
                     <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 font-black text-lg sm:text-xl italic">A</div>
                     <div>
                        <span className="font-black tracking-tighter uppercase text-slate-900 dark:text-white block leading-none text-sm sm:text-base">Admin Console</span>
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">System Management</span>
                     </div>
                 </div>
                 <div className="flex items-center gap-2 sm:gap-4">
                     <DeviceBadge />
                     <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="hidden sm:flex" />
                     <button onClick={handleLogout} className="px-3 sm:px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95">Sign Out</button>
                 </div>
             </div>
             <div className="max-w-[98%] mx-auto p-3 sm:p-6 md:p-10">
                 {renderDashboard()}
             </div>
             <BottomNav 
               user={user} 
               currentPage={currentPage} 
               onNavigate={handleNavigate} 
               onOpenSidebar={() => setIsSidebarOpen(true)} 
             />
          </div>
      )
  }

  // Standard App Layout
  return (
    <div className="flex min-h-[100dvh] bg-slate-50 dark:bg-slate-950 font-sans text-base transition-colors duration-200">
      
      {/* Mobile Sticky Header optimized for Android gesture & top safe area */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 z-40 flex items-center justify-between shadow-xs pt-[max(0.75rem,env(safe-area-inset-top))]">
         <div className="flex items-center gap-2.5">
             <button 
               onClick={() => setIsSidebarOpen(true)} 
               className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all active:scale-90 border border-slate-200 dark:border-slate-700 touch-target"
               aria-label="Open menu"
             >
                 <Menu size={20} className="text-slate-900 dark:text-white" />
             </button>
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center font-black text-white dark:text-slate-900 text-base italic shadow-sm">N</div>
                <span className="font-black tracking-tighter uppercase text-slate-900 dark:text-white text-base">Nexus</span>
             </div>
         </div>
         <div className="flex items-center gap-2">
            <DeviceBadge className="scale-90 sm:scale-100" />
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <img src={user.avatarUrl} alt="User" className="w-8 h-8 rounded-xl border-2 border-white dark:border-slate-800 shadow-xs object-cover" />
         </div>
      </div>

      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <main className="flex-1 transition-all duration-300 w-full min-w-0 md:ml-72 pt-20 md:pt-6 pb-28 md:pb-12 px-3 sm:px-6 md:px-12 overflow-x-hidden">
        {/* Desktop Top Header Bar with Device Scaler & Theme Toggle */}
        <div className="hidden md:flex justify-between items-center mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
              {user.schoolName || 'Nexus Academy'}
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Welcome back, {user.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <DeviceBadge />
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {renderDashboard()}
        </div>
      </main>

      {/* Android Mobile Native Bottom Navigation */}
      <BottomNav 
        user={user} 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        onOpenSidebar={() => setIsSidebarOpen(true)} 
      />
    </div>
  );
}

export default App;