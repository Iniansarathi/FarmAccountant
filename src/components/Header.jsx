import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, CloudOff, RefreshCw, Smartphone, Globe, Menu, LogOut } from 'lucide-react';

export default function Header({ user, syncStatus, onTriggerSync, onOpenSidebar, onLogout, onSetupLocalPassword }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'mr', name: 'मराठी' }
  ];

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200" title={t('header.synced')}>
            <Cloud size={13} className="text-emerald-500" />
            <span className="hidden sm:inline">{t('header.synced')}</span>
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 soft-pulse cursor-wait" title={t('header.syncing')}>
            <RefreshCw size={13} className="animate-spin text-amber-500" />
            <span className="hidden sm:inline">{t('header.syncing')}</span>
          </span>
        );
      case 'unsaved':
        return (
          <button 
            onClick={onTriggerSync}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 hover-scale cursor-pointer"
            title="Click to sync manually"
          >
            <Cloud size={13} className="text-amber-600" />
            <span className="hidden sm:inline">{t('header.unsaved')}</span>
          </button>
        );
      case 'error':
        return (
          <button 
            onClick={onTriggerSync}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover-scale cursor-pointer"
            title="Sync failed. Click to retry."
          >
            <CloudOff size={13} className="text-rose-500" />
            <span className="hidden sm:inline">Error (Retry)</span>
          </button>
        );
      case 'local':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200" title={t('header.local_mode')}>
            <Smartphone size={13} className="text-slate-500" />
            <span className="hidden sm:inline">{t('header.local_mode')}</span>
          </span>
        );
    }
  };

  return (
    <header className="relative z-50 bg-white border-b border-slate-100 px-4 py-3 sm:px-6 flex items-center justify-between shrink-0">
      {/* Brand Logo & Name */}
      <div 
        onClick={onOpenSidebar}
        className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
        title="Open Sidebar Menu"
      >
        <button 
          type="button"
          className="p-1 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors mr-0.5"
        >
          <Menu size={18} />
        </button>
        <div className="w-8 h-8 rounded-xl bg-[#0C9D61] flex items-center justify-center shadow-md shadow-[#0c9d61]/25">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-4.5 h-4.5 fill-white">
            <rect x="25" y="55" width="10" height="25" rx="2.5"/>
            <rect x="39" y="41" width="10" height="39" rx="2.5"/>
            <rect x="53" y="31" width="10" height="49" rx="2.5"/>
            <path d="M 58 31 C 58 19, 46 19, 46 19" stroke="white" stroke-width="5.5" stroke-linecap="round" fill="none"/>
            <path d="M 46 19 C 29 19, 26 37, 43 39 C 47 33, 47 24, 46 19 Z"/>
            <path d="M 46 19 C 63 17, 66 35, 49 37 C 45 31, 45 24, 46 19 Z"/>
          </svg>
        </div>
        <div className="text-left">
          <h1 className="font-display font-bold text-md text-slate-800 tracking-tight m-0 leading-none">
            {t('app_name')}
          </h1>
          <p className="text-[8px] text-slate-500 font-sans tracking-wide uppercase leading-none mt-1 hidden xs:block font-bold">
            {user?.type === 'google' ? 'Google Sync' : 'Local Cache'}
          </p>
        </div>
      </div>

      {/* Action Tray */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Status */}
        {getSyncBadge()}

        {/* Language Selector Dropdown */}
        <div className="relative inline-flex items-center">
          <Globe size={13} className="absolute left-2 text-slate-400 pointer-events-none" />
          <select
            value={i18n.resolvedLanguage || 'en'}
            onChange={handleLanguageChange}
            className="pl-6 pr-1.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer shadow-sm appearance-none max-w-[80px] sm:max-w-none min-w-[70px] sm:min-w-[110px]"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* User Account / Profile Button Container */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center justify-center rounded-full border border-slate-200 p-0.5 bg-white hover-scale hover-scale-active shadow-sm cursor-pointer"
            title="User Profile Menu"
          >
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt={user.name || user.username} 
                className="w-7 h-7 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold font-display">
                {(user?.name || user?.username || 'F').substring(0, 1).toUpperCase()}
              </div>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <>
              {/* Click-away backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              
              {/* Dropdown Card */}
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-100 bg-white p-3.5 shadow-xl z-50 text-left space-y-3">
                {/* User Info Header */}
                <div className="pb-2 border-b border-slate-100">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">User Info</p>
                  <p className="text-xs font-bold text-slate-850 mt-1 truncate">{user?.name || user?.username || 'Farmer'}</p>
                  <p className="text-[10px] text-slate-500 truncate leading-snug">{user?.email || 'Device offline account'}</p>
                </div>
                
                {/* Login Detail */}
                <div className="py-0.5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Login Detail</p>
                  <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 leading-snug">
                    <Smartphone size={10} className="text-slate-400" />
                    <span>{user?.type === 'google' ? 'Google Authenticated' : 'Device Local Account'}</span>
                  </div>
                </div>
                
                {/* Set Password Option (Only for Google Users) */}
                {user?.type === 'google' && (
                  <div className="py-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onSetupLocalPassword();
                      }}
                      className="w-full text-center py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 font-semibold text-[10px] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span>🔑</span>
                      <span>Link Offline local Password</span>
                    </button>
                  </div>
                )}
                
                {/* Logout Button */}
                <div className="pt-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer border border-rose-100 hover:text-rose-700"
                  >
                    <LogOut size={12} />
                    <span>{t('header.logout')}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
