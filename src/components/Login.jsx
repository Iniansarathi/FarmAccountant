import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, UserPlus, Globe } from 'lucide-react';
import { loginLocal, signupLocal, requestGoogleToken } from '../services/auth';

export default function Login({ onAuthSuccess }) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'mr', name: 'मराठी' }
  ];

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    try {
      if (activeTab === 'login') {
        const user = loginLocal(username, password);
        onAuthSuccess(user);
      } else {
        signupLocal(username, password);
        setSuccessMsg("Signup successful! You can now log in.");
        setActiveTab('login');
        setPassword('');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleGoogleLogin = (forceConsent = false) => {
    setErrorMsg('');
    try {
      requestGoogleToken(forceConsent);
    } catch (err) {
      console.error(err);
      if (err.message === "google_blocked") {
        setErrorMsg("Google login library is blocked by your browser (e.g. Brave Shields, Safari Content Blocker, or Ad-blocker). Please disable shields/ad-blocker for this website and refresh.");
      } else if (err.message === "client_not_initialized") {
        setErrorMsg("Google Sign-In is not initialized. Please ensure VITE_GOOGLE_CLIENT_ID is set correctly in Vercel settings and that you have redeployed the project.");
      } else {
        setErrorMsg("Google Sign-In could not be loaded. Please check your internet connection and refresh.");
      }
    }
  };

  return (
    <div className="min-h-svh w-full flex flex-col justify-between bg-slate-50 px-4 py-8">
      
      {/* Language Bar in Header */}
      <div className="w-full max-w-sm mx-auto flex justify-end items-center gap-1.5 mb-6">
        <Globe size={14} className="text-slate-400" />
        <select
          value={i18n.resolvedLanguage || 'en'}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded px-2 py-1 focus:outline-none cursor-pointer"
        >
          {languages.map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Main card */}
      <div className="w-full max-w-sm mx-auto glass-card rounded-3xl p-6 border border-slate-200 shadow-lg text-center space-y-6">
        
        {/* Brand logo */}
        <div className="space-y-2">
          <div className="w-14 h-14 bg-[#0C9D61] text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-[#0c9d61]/25">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8 fill-white">
              <rect x="25" y="55" width="10" height="25" rx="2.5"/>
              <rect x="39" y="41" width="10" height="39" rx="2.5"/>
              <rect x="53" y="31" width="10" height="49" rx="2.5"/>
              <path d="M 58 31 C 58 19, 46 19, 46 19" stroke="white" stroke-width="5.5" stroke-linecap="round" fill="none"/>
              <path d="M 46 19 C 29 19, 26 37, 43 39 C 47 33, 47 24, 46 19 Z"/>
              <path d="M 46 19 C 63 17, 66 35, 49 37 C 45 31, 45 24, 46 19 Z"/>
            </svg>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-800 tracking-tight m-0 leading-none">
            {t('app_name')}
          </h2>
          <p className="text-xs text-slate-400 max-w-[250px] mx-auto mt-2">
            {t('app_subtitle')}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 p-0.5 bg-slate-100 rounded-xl">
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-655'
            }`}
          >
            <LogIn size={13} className="inline mr-1" />
            {t('auth.login')}
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'signup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-655'
            }`}
          >
            <UserPlus size={13} className="inline mr-1" />
            {t('auth.signup')}
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-xs font-medium text-left">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-xs font-medium text-left">
            {successMsg}
          </div>
        )}

        {/* Local Sign in / Sign up form */}
        <form onSubmit={handleLocalSubmit} className="space-y-3 text-left">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t('auth.username')}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ramesh_farmer"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer hover-scale hover-scale-active shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5"
          >
            {activeTab === 'login' ? t('auth.login') : t('auth.signup')}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center text-slate-300">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">Or Sync Cloud</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Google OAuth trigger */}
        <div className="space-y-2">
                  {/* Continue with Google (Quick) */}
          <button
            onClick={() => handleGoogleLogin(false)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer hover-scale hover-scale-active shadow-md flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            {t('auth.google_continue')}
          </button>

          {/* Sign in with Google (Fresh Consent / Reset permissions) */}
          <button
            onClick={() => handleGoogleLogin(true)}
            className="w-full py-2 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            title="Forces permissions request if sync is blocked"
          >
            <span>🔗</span>
            <span>{t('auth.google_sign_in')} (Reset Permissions)</span>
          </button>
        </div>

        {/* Local Storage Privacy Warning */}
        <p className="text-[10px] text-slate-450 leading-relaxed text-slate-500 font-medium text-left">
          {t('auth.local_mode_notice')}
        </p>

      </div>

      {/* Footer footer information */}
      <div className="text-center text-[10px] text-slate-400 font-semibold mt-4">
        farmaccountant App • Made for Indian Farmers • Secure & Offline-First
      </div>

    </div>
  );
}
