import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ArrowRight } from 'lucide-react';
import { APP_VERSION } from '../config/version';

export default function LanguageSelector({ onConfirm }) {
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.resolvedLanguage || 'en');
  const [isExiting, setIsExiting] = useState(false);

  const languages = [
    { code: 'en', nativeName: 'English', englishName: 'English', greeting: 'Welcome' },
    { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', greeting: 'வரவேற்பு' },
    { code: 'hi', nativeName: 'हिंदी', englishName: 'Hindi', greeting: 'स्वागत है' },
    { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', greeting: 'స్వాగతం' },
    { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', greeting: 'ಸ್ವಾಗತ' },
    { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', greeting: 'स्वागत आहे' }
  ];

  const handleLanguageSelect = (code) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
  };

  const handleConfirm = () => {
    setIsExiting(true);
    setTimeout(() => {
      sessionStorage.setItem('language_confirmed', 'true');
      onConfirm();
    }, 450); // Matches the exit scaling transition
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-between bg-slate-50 dark:bg-slate-950 transition-all duration-500 ${
      isExiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
    }`}>
      
      {/* Default Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-55 shadow-sm transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0C9D61] text-white flex items-center justify-center font-display font-extrabold text-sm shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-4.5 h-4.5 fill-white">
              <rect x="25" y="55" width="10" height="25" rx="2.5"/>
              <rect x="39" y="41" width="10" height="39" rx="2.5"/>
              <rect x="53" y="31" width="10" height="49" rx="2.5"/>
              <path d="M 58 31 C 58 19, 46 19, 46 19" stroke="white" stroke-width="5.5" stroke-linecap="round" fill="none"/>
              <path d="M 46 19 C 29 19, 26 37, 43 39 C 47 33, 47 24, 46 19 Z"/>
              <path d="M 46 19 C 63 17, 66 35, 49 37 C 45 31, 45 24, 46 19 Z"/>
            </svg>
          </div>
          <span className="font-display font-extrabold text-md tracking-tight text-slate-800 dark:text-slate-100">farmaccountant</span>
        </div>
        <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 bg-slate-55 dark:bg-slate-950 px-2.5 py-1 rounded-md border border-slate-100 dark:border-slate-850">
          <Globe size={11} className="animate-[spin_10s_linear_infinite] text-[#0C9D61] dark:text-emerald-450" /> Language Setup
        </div>
      </header>
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-200/20 dark:bg-emerald-950/10 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-100/25 dark:bg-amber-950/5 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 mt-16 mb-16 overflow-y-auto">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-150 dark:border-slate-800 shadow-2xl space-y-6 text-center animate-scale-in transition-colors">
          
          {/* Header Section */}
          <div className="space-y-3">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 text-[#0C9D61] dark:text-emerald-450 rounded-2xl flex items-center justify-center mx-auto shadow border border-emerald-100 dark:border-emerald-900/30 hover:rotate-12 transition-transform duration-300 cursor-pointer">
              <Globe size={26} className="animate-[spin_20s_linear_infinite]" />
            </div>
            
            <div className="space-y-1">
              <h2 className="font-display font-extrabold text-2xl text-slate-850 dark:text-white tracking-tight leading-none mt-1">
                Select Language
              </h2>
              <p className="text-[15px] font-bold text-[#0C9D61] dark:text-emerald-450">
                மொழி தேர்வு / भाषा का चयन
              </p>
            </div>

            <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed max-w-[280px] mx-auto">
              Choose your preferred language to customize your ledger experience
            </p>
          </div>

          {/* Language Selection Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {languages.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-300 hover-scale hover-scale-active cursor-pointer flex flex-col justify-between h-20 ${
                    isSelected
                      ? 'border-[#0C9D61] bg-emerald-50/10 dark:bg-emerald-950/20 ring-2 ring-emerald-500/10 shadow-md text-emerald-600 dark:text-emerald-450'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-355 dark:hover:border-slate-700 hover:bg-slate-55 dark:hover:bg-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isSelected ? 'text-[#0C9D61] dark:text-emerald-450' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {lang.englishName}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#0C9D61]"></span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="block font-display font-black text-sm text-slate-800 dark:text-slate-100">
                      {lang.nativeName}
                    </span>
                    <span className="block text-[9px] text-slate-400 dark:text-slate-550 font-semibold">
                      "{lang.greeting}"
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3 bg-[#0C9D61] hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all cursor-pointer hover-scale hover-scale-active shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 group border border-transparent"
            >
              <span>Continue / தொடரவும்</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>

      {/* Dynamic App Version Footer */}
      <footer className="fixed bottom-6 left-0 right-0 text-center pointer-events-none z-40">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
          Version v{APP_VERSION}
        </span>
      </footer>

    </div>
  );
}
