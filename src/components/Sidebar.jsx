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
  onToggleTheme
}) {
  const { t } = useTranslation();

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
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-105 border-slate-100 bg-emerald-800 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white text-emerald-800 flex items-center justify-center font-display font-extrabold text-sm">
              fa
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
