import React, { useState } from 'react';
import { loginWithSchoolID } from '../services/authService';
import { User } from '../types';
import { Loader2, School } from 'lucide-react';
import DeviceBadge from '../components/DeviceBadge';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onShowPreview?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onShowPreview }) => {
  const [schoolID, setSchoolID] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await loginWithSchoolID(schoolID, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-white dark:bg-slate-950 overflow-x-hidden">
      {/* Device Mode Badge top corner */}
      <div className="absolute top-4 right-4 z-50">
        <DeviceBadge />
      </div>

      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center font-black text-4xl text-slate-950 italic mb-12 shadow-2xl animate-float">
            N
          </div>
          <h1 className="text-display text-white mb-8">
            The Future of <span className="text-blue-500">Education</span> Management.
          </h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed mb-12">
            Experience a seamless, high-performance platform designed for modern schools. Precision, speed, and elegance in one place.
          </p>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-4xl font-black text-white mb-1">12k+</p>
              <p className="text-label text-blue-500">Active Students</p>
            </div>
            <div>
              <p className="text-4xl font-black text-white mb-1">99.9%</p>
              <p className="text-label text-blue-500">System Uptime</p>
            </div>
          </div>
        </div>

        {/* Decorative Rail Text */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180">
          <p className="text-label opacity-20">NEXUS PREMIUM v2.4.0 • ENTERPRISE EDITION</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 relative min-h-[100dvh]">
        <div className="max-w-md w-full my-auto">
          <div className="mb-8 sm:mb-12">
            <div className="lg:hidden w-12 h-12 bg-slate-950 dark:bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-white dark:text-slate-950 italic mb-6">
              N
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-medium text-sm sm:text-base">Access your secure management portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest rounded-2xl border border-red-100 dark:border-red-800/50 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-label ml-1">School ID</label>
              <input
                type="text"
                value={schoolID}
                onChange={(e) => setSchoolID(e.target.value)}
                className="w-full min-h-[48px] text-base"
                placeholder="e.g., TCH-550"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-label ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[48px] text-base"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full min-h-[50px] flex items-center justify-center gap-3 text-sm active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Authenticating
                </>
              ) : (
                <>
                  Access Portal
                  <School size={18} />
                </>
              )}
            </button>

            {onShowPreview && (
              <button
                type="button"
                onClick={onShowPreview}
                className="w-full min-h-[48px] py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-wider text-xs transition-all shadow-md active:scale-95 flex justify-center items-center gap-2 border border-slate-700"
              >
                Explore as Guest / Preview
              </button>
            )}
          </form>

          <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-slate-100 dark:border-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-label opacity-50">Technical Support</p>
              <a href="mailto:helpdesk@nexus.app" className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline">Contact IT</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;