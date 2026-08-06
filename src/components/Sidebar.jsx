import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, LogOut, User, Cloud, RefreshCw, Layers, ShieldCheck, Smartphone } from 'lucide-react';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  user, 
  syncStatus, 
  onLogout, 
  onNavigate,
  onSwitchGoogleAccount,
  theme,
  onToggleTheme,
  deferredPrompt,
  onTriggerInstall,
  onShowIOSInstallGuide,
  onOpenFeedback
}) {
  const { t } = useTranslation();

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone
  );

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleInstallClick = () => {
    if (isIOS) {
      onShowIOSInstallGuide();
      onClose();
    } else if (deferredPrompt) {
      onTriggerInstall();
      onClose();
    } else {
      alert("To install FarmAccountant: \n\n• On Android/Chrome: Tap the 3 dots in the top-right corner of Chrome and select 'Add to Home screen' or 'Install app'.\n• On iPhone/Safari: Tap the Share button at the bottom and select 'Add to Home screen'.");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden font-sans">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
      />

      {/* Drawer panel */}
      <div className="relative flex w-full max-w-xs flex-col bg-white h-full shadow-2xl transition-transform duration-350 ease-out border-r border-slate-100 z-10 animate-slide-in">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-[#0C5A52] text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white text-[#0C9D61] flex items-center justify-center font-display font-extrabold text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-4.5 h-4.5 fill-[#0C9D61]">
                <rect x="25" y="55" width="10" height="25" rx="2.5"/>
                <rect x="39" y="41" width="10" height="39" rx="2.5"/>
                <rect x="53" y="31" width="10" height="49" rx="2.5"/>
                <path d="M 58 31 C 58 19, 46 19, 46 19" stroke="#0C9D61" stroke-width="5.5" stroke-linecap="round" fill="none"/>
                <path d="M 46 19 C 29 19, 26 37, 43 39 C 47 33, 47 24, 46 19 Z"/>
                <path d="M 46 19 C 63 17, 66 35, 49 37 C 45 31, 45 24, 46 19 Z"/>
              </svg>
            </div>
            <span className="font-display font-extrabold text-md tracking-tight">farmaccountant</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-700/50 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name} 
                className="w-12 h-12 rounded-full border border-emerald-500 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-semibold">
                <User size={22} />
              </div>
            )}
            <div className="text-left min-w-0 flex-1">
              <h4 className="font-bold text-slate-800 text-sm truncate leading-tight">
                {user?.name || user?.username || 'Farmer'}
              </h4>
              <p className="text-[11px] text-slate-550 text-slate-400 truncate mt-0.5">
                {user?.email || t('header.local_mode')}
              </p>
            </div>
          </div>

          {/* Account detail & Switch Actions */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-left">
            {user?.type === 'google' ? (
              <>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                  <ShieldCheck size={11} /> {t('sidebar.google_active')}
                </div>
                <button
                  onClick={onSwitchGoogleAccount}
                  className="w-full text-center py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 font-bold text-[10px] transition-all cursor-pointer hover-scale hover-scale-active shadow-sm"
                >
                  {t('sidebar.switch_account')}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                  <Smartphone size={11} /> {t('sidebar.local_active')}
                </div>
                <button
                  onClick={onSwitchGoogleAccount} // connects Google
                  className="w-full text-center py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 font-bold text-[10px] transition-all cursor-pointer hover-scale hover-scale-active shadow-sm"
                >
                  {t('sidebar.connect_google')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sync Summary */}
        <div className="px-4 py-3 text-left border-b border-slate-100 text-xs">
          <div className="flex justify-between items-center text-slate-400 font-semibold mb-1">
            <span>{t('sidebar.sync_status')}</span>
            <span className="uppercase text-[9px] font-bold text-slate-500">{syncStatus}</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            {user?.type === 'google' 
              ? t('sidebar.sync_google_desc') 
              : t('sidebar.sync_local_desc')}
          </p>
        </div>

        {/* Navigation / Drawer Items */}
        <div className="flex-1 py-4 overflow-y-auto px-2 space-y-1">
          <button
            onClick={() => { onNavigate('dashboard'); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-655 hover:bg-emerald-50/50 hover:text-emerald-700 text-slate-700 font-semibold text-xs rounded-lg transition-all cursor-pointer text-left"
          >
            <Layers size={15} /> {t('sidebar.nav_home')}
          </button>
          
          <button
            onClick={() => { onNavigate('crop_form'); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-655 hover:bg-emerald-50/50 hover:text-emerald-700 text-slate-700 font-semibold text-xs rounded-lg transition-all cursor-pointer text-left"
          >
            <Cloud size={15} /> {t('sidebar.nav_crop')}
          </button>

          <button
            onClick={() => { onNavigate('analytics'); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-655 hover:bg-emerald-50/50 hover:text-emerald-700 text-slate-700 font-semibold text-xs rounded-lg transition-all cursor-pointer text-left"
          >
            <RefreshCw size={15} /> {t('sidebar.nav_analytics')}
          </button>

          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[#0c9d61] hover:bg-emerald-50/50 hover:text-emerald-700 font-bold text-xs rounded-lg transition-all cursor-pointer text-left"
            >
              <Smartphone size={15} /> Install App Shortcut
            </button>
          )}

          <button
            onClick={() => { onOpenFeedback(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-655 hover:bg-emerald-50/50 hover:text-emerald-700 text-slate-700 font-semibold text-xs rounded-lg transition-all cursor-pointer text-left"
          >
            <span className="text-sm">💬</span> Send Feedback
          </button>

          {user?.email === 'iniansarathi2003@gmail.com' && (
            <button
              onClick={() => { onNavigate('admin_portal'); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 bg-rose-50/20 hover:bg-rose-55 hover:text-rose-700 font-bold text-xs rounded-lg transition-all cursor-pointer text-left"
            >
              🛡️ Admin Portal
            </button>
          )}
        </div>

        {/* Theme Toggle Section */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span>Theme Mode</span>
          </div>
          <button
            onClick={onToggleTheme}
            className="px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold hover-scale hover-scale-active transition-all cursor-pointer shadow-sm flex items-center gap-1 text-slate-600"
          >
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        {/* Footer Logout Option */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[9px] text-slate-400 font-semibold">farmaccountant v1.0</span>
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-[10px] font-bold hover-scale hover-scale-active transition-all cursor-pointer shadow-sm"
          >
            <LogOut size={12} /> {t('header.logout')}
          </button>
        </div>

      </div>

      {/* Additional animation CSS */}
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
}
