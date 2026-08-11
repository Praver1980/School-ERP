import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, RefreshCw, Layers, ShieldCheck } from 'lucide-react';

export type DisplayProfile = 'auto' | 'android' | 'windows';

interface DeviceBadgeProps {
  onProfileChange?: (profile: DisplayProfile) => void;
  className?: string;
}

export const DeviceBadge: React.FC<DeviceBadgeProps> = ({ onProfileChange, className = '' }) => {
  const [detectedProfile, setDetectedProfile] = useState<'android' | 'windows' | 'tablet'>('windows');
  const [aspectRatio, setAspectRatio] = useState<string>('');
  const [overrideProfile, setOverrideProfile] = useState<DisplayProfile>('auto');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const inspectDevice = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ratio = (w / h).toFixed(2);
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const ua = navigator.userAgent.toLowerCase();
      const isAndroidUA = ua.includes('android') || ua.includes('mobile');

      let mode: 'android' | 'windows' | 'tablet' = 'windows';

      if (w <= 768 || isAndroidUA) {
        mode = 'android';
      } else if (w <= 1024 && isTouch) {
        mode = 'tablet';
      } else {
        mode = 'windows';
      }

      setDetectedProfile(mode);
      setAspectRatio(`${w}×${h} (${ratio})`);
    };

    inspectDevice();
    window.addEventListener('resize', inspectDevice);
    return () => window.removeEventListener('resize', inspectDevice);
  }, []);

  const currentMode = overrideProfile === 'auto' ? detectedProfile : overrideProfile;

  const handleSelect = (profile: DisplayProfile) => {
    setOverrideProfile(profile);
    if (onProfileChange) onProfileChange(profile);
    setShowPicker(false);

    // Apply scaling class to body for custom CSS tweaks if selected manually
    document.body.classList.remove('device-android', 'device-windows');
    if (profile === 'android' || (profile === 'auto' && detectedProfile === 'android')) {
      document.body.classList.add('device-android');
    } else if (profile === 'windows' || (profile === 'auto' && detectedProfile === 'windows')) {
      document.body.classList.add('device-windows');
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-700 active:scale-95 shadow-xs"
        title="Display & Scale Ratio Profile"
      >
        {currentMode === 'android' ? (
          <Smartphone size={14} className="text-emerald-500 animate-pulse" />
        ) : currentMode === 'tablet' ? (
          <Tablet size={14} className="text-amber-500" />
        ) : (
          <Monitor size={14} className="text-blue-500" />
        )}
        <span className="truncate">
          {currentMode === 'android' ? 'Android Mobile' : currentMode === 'tablet' ? 'Android Tablet' : 'Windows PC'}
        </span>
        <span className="hidden sm:inline-block text-[9px] opacity-60 font-mono bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded-md">
          {aspectRatio}
        </span>
      </button>

      {showPicker && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Scaling Mode</span>
            <span className="text-[9px] text-blue-500 font-bold">Ratio Optimized</span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleSelect('auto')}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                overrideProfile === 'auto'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <RefreshCw size={14} />
                <span>Auto-Detect Ratio</span>
              </div>
              <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                {detectedProfile}
              </span>
            </button>

            <button
              onClick={() => handleSelect('android')}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                currentMode === 'android' && overrideProfile !== 'auto'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Smartphone size={14} className="text-emerald-500" />
                <span>Android Layout (Touch)</span>
              </div>
              <span className="text-[9px] text-emerald-500 font-bold">19.5:9</span>
            </button>

            <button
              onClick={() => handleSelect('windows')}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                currentMode === 'windows' && overrideProfile !== 'auto'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Monitor size={14} className="text-blue-500" />
                <span>Windows Layout (Widescreen)</span>
              </div>
              <span className="text-[9px] text-blue-500 font-bold">16:9</span>
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
            Adapts padding, touch targets & density per screen.
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceBadge;
