import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ArrowRight } from 'lucide-react';

export default function LanguageSelector({ onConfirm }) {
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.resolvedLanguage || 'en');
  const [isExiting, setIsExiting] = useState(false);

  const languages = [
    { code: 'en', nativeName: 'English', englishName: 'English', greeting: 'Welcome' },
    { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', greeting: 'வரவேற்பு' },
    { code: 'hi', nativeName: 'हिंदी', englishName: 'Hindi', greeting: 'स्वागत है' },
    { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', greeting: 'స్వాగతం' },
    { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', greeting: 'ಸ್ವಾಗत' },
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
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-4 transition-all duration-500 ${
      isExiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
    }`}>
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-100/35 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 text-center animate-scale-in">
        
        {/* Header Section */}
        <div className="space-y-3">
          <div className="w-14 h-14 bg-[#0C9D61] text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 hover:rotate-12 transition-transform duration-300 cursor-pointer">
            <Globe size={26} className="animate-[spin_20s_linear_infinite]" />
          </div>
          
          <div className="space-y-1">
            <h2 className="font-display font-extrabold text-2xl text-slate-800 tracking-tight leading-none mt-1">
              Select Language
            </h2>
            <p className="text-[15px] font-bold text-[#0C9D61]">
              மொழி தேர்வு / भाषा का चयन
            </p>
          </div>

          <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-[280px] mx-auto">
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
                onClick={() => handleLanguageSelect(lang.code)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-300 hover-scale hover-scale-active cursor-pointer flex flex-col justify-between h-20 ${
                  isSelected
                    ? 'border-[#0C9D61] bg-emerald-50/15 ring-2 ring-emerald-500/10 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected ? 'text-[#0C9D61]' : 'text-slate-400'
                  }`}>
                    {lang.englishName}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#0C9D61]"></span>
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className="block font-display font-black text-sm text-slate-800">
                    {lang.nativeName}
                  </span>
                  <span className="block text-[9px] text-slate-400 font-medium">
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
            onClick={handleConfirm}
            className="w-full py-3 bg-[#0C9D61] hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all cursor-pointer hover-scale hover-scale-active shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 group"
          >
            <span>Continue / தொடரவும்</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}
