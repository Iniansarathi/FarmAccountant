import React from 'react';
import { Smartphone, Download, Share, CheckCircle2 } from 'lucide-react';

export default function InstallOverlay({ 
  onSkip, 
  deferredPrompt, 
  setDeferredPrompt, 
  isSuccessfullyInstalled, 
  setIsSuccessfullyInstalled 
}) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsSuccessfullyInstalled(true);
        // Transition to app dashboard after 2.5s success animation
        setTimeout(() => {
          setIsSuccessfullyInstalled(false);
          onSkip(); // Skip installer to open dashboard
        }, 2500);
      }
    } catch (err) {
      console.error("PWA Installation failed:", err);
    }
  };

  if (isSuccessfullyInstalled) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center animate-fade-in text-slate-800 dark:text-white transition-colors">
        {/* Decorative blur orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-200/20 dark:bg-emerald-950/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        
        <div className="space-y-4 max-w-sm animate-scale-in">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-[#0C9D61] rounded-full flex items-center justify-center mx-auto shadow-md border border-emerald-100 dark:border-emerald-900/30 animate-bounce">
            <CheckCircle2 size={36} className="text-emerald-600 dark:text-emerald-450" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-extrabold text-lg tracking-tight leading-none text-slate-850 dark:text-white">
              Successfully Installed!
            </h3>
            <p className="text-[10px] font-bold text-emerald-650 dark:text-emerald-450 uppercase tracking-wider">
              வெற்றிகரமாக நிறுவப்பட்டது! / सफलतापूर्वक इंस्टॉल किया गया!
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
              You can now launch FarmAccountant directly from your home screen with faster speeds and offline support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[180] flex flex-col justify-between bg-slate-50 dark:bg-slate-950 p-6 text-center transition-colors animate-fade-in overflow-y-auto">
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-200/20 dark:bg-emerald-950/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-100/25 dark:bg-amber-950/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      {/* Top Header Branding */}
      <header className="w-full flex items-center justify-center gap-2 py-4">
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
        <span className="font-display font-extrabold text-md tracking-tight text-slate-850 dark:text-slate-100">farmaccountant</span>
      </header>

      {/* Main Pitch Card Container */}
      <div className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-150 dark:border-slate-800 shadow-2xl space-y-6 text-center animate-scale-in transition-colors">
          
          {/* Animated visual badge */}
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-[#0C9D61] dark:text-emerald-450 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-emerald-100/50 dark:border-emerald-900/20">
            {isIOS ? (
              <Share size={28} className="animate-bounce" />
            ) : (
              <Smartphone size={28} className="animate-pulse" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-xl text-slate-850 dark:text-white tracking-tight leading-none">
              Install App on Home Screen
            </h2>
            <p className="text-[11px] font-bold text-[#0C9D61] dark:text-emerald-450 uppercase tracking-wider">
              பயன்பாட்டை நிறுவவும் / ऐप इंस्टॉल करें
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
              Add FarmAccountant to your home screen for offline bookkeeping, zero loading times, and a full-screen mobile app experience.
            </p>
          </div>

          {/* Conditional Instructions (Android/PC vs iOS) */}
          {isIOS ? (
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 text-left space-y-2.5 text-xs text-slate-650 dark:text-slate-350 font-semibold leading-relaxed">
              <span className="text-[9px] font-extrabold text-[#0C9D61] dark:text-emerald-450 uppercase tracking-wider block">Safari Installation Instructions:</span>
              <p className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <span>Tap the **Share** icon (📤) in Safari's bottom toolbar.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <span>Scroll down the share menu and select **Add to Home Screen** (➕).</span>
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <button
                type="button"
                disabled={!deferredPrompt}
                onClick={handleInstallClick}
                className={`w-full py-3 rounded-2xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover-scale hover-scale-active ${
                  deferredPrompt 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/15 border border-transparent'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300/30 cursor-not-allowed shadow-none'
                }`}
              >
                <Download size={15} />
                <span>{deferredPrompt ? "Install App / இப்போதே நிறுவுக" : "App Already Installed"}</span>
              </button>
              
              {!deferredPrompt && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal">
                  If you already installed it, look for the FarmAccountant icon on your home screen or desktop application list.
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Skip Button (translucent, bottom-right) */}
      <footer className="w-full flex justify-end p-2 relative z-50">
        <button
          type="button"
          onClick={onSkip}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold hover:bg-white dark:hover:bg-slate-900 shadow-sm backdrop-blur-sm cursor-pointer transition-all uppercase tracking-widest hover-scale hover-scale-active"
        >
          Skip / தவிர் ➔
        </button>
      </footer>

    </div>
  );
}
