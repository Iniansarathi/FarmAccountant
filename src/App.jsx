import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Sprout, BarChart3 } from 'lucide-react';
import './i18n'; // Import i18n initialization

// Components
import Login from './components/Login';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CropForm from './components/CropForm';
import ExpenseForm from './components/ExpenseForm';
import HarvestForm from './components/HarvestForm';
import CropDetails from './components/CropDetails';
import Analytics from './components/Analytics';
import AdminPortal from './components/AdminPortal';
import LanguageSelector from './components/LanguageSelector';

// Services
import { initGoogleOAuth, fetchGoogleUserInfo, getStoredGoogleToken, clearAuthSession, requestGoogleToken, registerPasswordForGoogleUser, revokeGoogleToken } from './services/auth';
import { loadUserData, saveUserData } from './services/storage';
import { submitUserFeedback, sendUserHeartbeat, requestDeletion, checkUserRegistration } from './services/adminApi';

export default function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [googleToken, setGoogleToken] = useState(null);
  const [fileId, setFileId] = useState(null);
  
  // App states
  const [isLanguageConfirmed, setIsLanguageConfirmed] = useState(!!sessionStorage.getItem('language_confirmed'));
  const [data, setData] = useState({ crops: [], expenses: [], harvests: [] });
  const [syncStatus, setSyncStatus] = useState('local'); // 'local', 'synced', 'syncing', 'unsaved', 'error'
  const [onboardingState, setOnboardingState] = useState('idle'); // 'idle', 'registering', 'success'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'crop_form', 'expense_form', 'harvest_form', 'crop_details', 'analytics'
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingHarvest, setEditingHarvest] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackScreenshot, setFeedbackScreenshot] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitSuccess, setFeedbackSubmitSuccess] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('farm_theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const scrollContainerRef = useRef(null);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Sync theme with class list
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('farm_theme', theme);
    } catch (e) {
      console.warn("Storage writing blocked:", e);
    }
  }, [theme]);

  // Reset scroll to top on navigation/view change
  useEffect(() => {
    const resetScroll = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    
    resetScroll();
    // Fallback timers to ensure scroll is reset after rendering/painting is done
    const timer = setTimeout(resetScroll, 0);
    const animFrame = requestAnimationFrame(resetScroll);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrame);
    };
  }, [currentView, selectedCropId]);

  // Initialize Google OAuth GSI client
  useEffect(() => {
    // Check if we have a stored token that is still valid
    const token = getStoredGoogleToken();
    const storedUser = localStorage.getItem('farm_current_user');
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      if (parsedUser.type === 'google') {
        if (token) {
          setGoogleToken(token);
          setSyncStatus('synced');
        } else if (parsedUser.isMock) {
          setSyncStatus('synced');
        } else {
          // Token expired, clear expired user session so they re-authenticate and sync fresh
          setUser(null);
          localStorage.removeItem('farm_current_user');
          setSyncStatus('local');
        }
      } else {
        setSyncStatus('local');
      }
    }

    // Initialize GIS Client
    initGoogleOAuth(
      async (tokenResponse) => {
        setSyncStatus('syncing');
        try {
          const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token);
          const loggedUser = {
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            type: 'google',
            isMock: false
          };
          // Set states to trigger the useEffect data fetch exactly once
          setGoogleToken(tokenResponse.access_token);
          setUser(loggedUser);
          localStorage.setItem('farm_current_user', JSON.stringify(loggedUser));
        } catch (err) {
          console.error("Failed to load user info:", err);
          setSyncStatus('error');
        }
      },
      (error) => {
        console.error("Google OAuth error:", error);
        setSyncStatus('error');
      }
    );
  }, []);

  // Handle Google OAuth Fallback Redirect Callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token') && hash.includes('google_oauth_fallback')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in') || '3600';
      
      // Clean hash from URL so it looks clean
      window.history.replaceState("", document.title, window.location.pathname + window.location.search);
      
      if (accessToken) {
        const handleCallbackLogin = async () => {
          setSyncStatus('syncing');
          try {
            const userInfo = await fetchGoogleUserInfo(accessToken);
            const loggedUser = {
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              type: 'google',
              isMock: false
            };
            
            // Save token and user in storage
            localStorage.setItem('google_access_token', accessToken);
            localStorage.setItem('google_token_expiry', (Date.now() + parseInt(expiresIn, 10) * 1000).toString());
            
            setGoogleToken(accessToken);
            setUser(loggedUser);
            localStorage.setItem('farm_current_user', JSON.stringify(loggedUser));
          } catch (err) {
            console.error("Redirect login failed:", err);
            setSyncStatus('error');
            alert("Google Sign-In failed during redirect. Please try again.");
          }
        };
        handleCallbackLogin();
      }
    }
  }, []);

  // Update manifest dynamically based on whether logged in as admin to support unique shortcut icons
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (link) {
      if (user && user.email === 'iniansarathi2003@gmail.com') {
        link.setAttribute('href', '/manifest-admin.json');
      } else {
        link.setAttribute('href', '/manifest.json');
      }
    }
  }, [user]);

  // Fetch/load user data when user changes
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      // For developer account, bypass onboarding
      if (user.email === 'iniansarathi2003@gmail.com') {
        setSyncStatus('synced');
        return;
      }

      // Check local cache first for instant bypass (avoids API checks for logged in users)
      let isNewUser = false;
      const localRegFlag = localStorage.getItem(`farm_registered_${user.email}`);
      
      if (localRegFlag !== 'true') {
        // If not flagged locally, verify with central spreadsheet database
        try {
          const checkRes = await checkUserRegistration(user.email);
          // ONLY treat as new if backend explicitly returns registered: false
          if (checkRes && checkRes.registered === false) {
            isNewUser = true;
          }
        } catch (err) {
          console.warn("Failed to check registration centrally, defaulting to existing user", err);
        }
      }

      if (user.type === 'google' && isNewUser) {
        setOnboardingState('registering');
      }
      setSyncStatus(user.type === 'google' ? 'syncing' : 'local');
      
      try {
        const loaded = await loadUserData(user, googleToken);
        if (loaded.error === 'permission_denied') {
          if (isNewUser) {
            // Send registration heartbeat to admin portal even if they denied drive permission
            if (user.type === 'google' && googleToken) {
              await sendUserHeartbeat(user, googleToken, false);
            }
            setSyncStatus('error');
            setOnboardingState('success');
            
            // Automatically logout after 3.5 seconds
            setTimeout(() => {
              handleLogout();
              setOnboardingState('idle');
            }, 3500);
          } else {
            // Existing user: direct logout callback to prompt GIS consent checkboxes again
            setSyncStatus('error');
            setOnboardingState('idle');
            handleLogout();
          }
        } else {
          setData(loaded.data || { crops: [], expenses: [], harvests: [] });
          if (loaded.fileId) setFileId(loaded.fileId);
          setSyncStatus(user.type === 'google' ? 'synced' : 'local');
          
          // Google user central database heartbeat registration (with permission)
          if (user.type === 'google' && googleToken) {
            await sendUserHeartbeat(user, googleToken, true);
            localStorage.setItem(`farm_registered_${user.email}`, 'true');
          }
          setOnboardingState('idle');
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setSyncStatus(user.type === 'google' ? 'error' : 'local');
        setOnboardingState('idle');
      }
    };
    
    fetchData();
  }, [user, googleToken]);

  // Handle data updates and synchronization
  const updateDataState = async (updatedData) => {
    setData(updatedData);
    if (!user) return;

    setSyncStatus(user.type === 'google' ? 'syncing' : 'local');
    try {
      await saveUserData(user, updatedData, googleToken, fileId);
      setSyncStatus(user.type === 'google' ? 'synced' : 'local');
    } catch (err) {
      console.error("Sync save failed:", err);
      setSyncStatus(user.type === 'google' ? 'unsaved' : 'local');
    }
  };

  // Auth Operations

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setData({ crops: [], expenses: [], harvests: [] });
    setGoogleToken(null);
    setFileId(null);
    localStorage.removeItem('farm_current_user');
    setCurrentView('dashboard');
  };

  const handleRequestDeleteAccount = async () => {
    if (!user) return;
    const confirmMessage = user.type === 'google'
      ? "Are you sure you want to request account deletion? This will delete your ledger file from Google Drive, revoke app permissions, clear your browser cache, and send a deletion request to the administrator. This action is irreversible!"
      : "Are you sure you want to permanently delete your local account and all stored crop data? This action is irreversible!";
      
    if (!window.confirm(confirmMessage)) return;

    try {
      if (user.type === 'google') {
        // 1. Delete backup database file from the user's personal Google Drive
        if (fileId && googleToken) {
          try {
            await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${googleToken}`
              }
            });
            console.log("Spreadsheet database file deleted successfully from Google Drive.");
          } catch (err) {
            console.error("Failed to delete Google Drive database backup file:", err);
          }
        }

        // 2. Revoke the Google OAuth token so it forces the permissions/consent screen next time
        if (googleToken) {
          await revokeGoogleToken(googleToken);
        }

        // 3. Send the central deletion request to the Admin portal/Google Sheet
        await requestDeletion(user);
        
        // 4. Clear local browser cache related to this account
        localStorage.removeItem(`farm_data_google_${user.email}`);
        localStorage.removeItem(`farm_registered_${user.email}`);
        localStorage.removeItem('google_drive_file_id');
        
        alert("Account deleted, Google Drive backup file removed, and permissions revoked. You will now be logged out.");
      } else {
        // Local user: delete ledger immediately
        localStorage.removeItem(`farm_data_local_${user.username}`);
        alert("Local account ledger deleted successfully.");
      }
      
      handleLogout();
    } catch (err) {
      console.error(err);
      alert("Failed to complete account deletion: " + err.message);
    }
  };

  const handleSwitchGoogleAccount = () => {
    setIsSidebarOpen(false);
    requestGoogleToken();
  };

  const handleLinkLocalPassword = (password) => {
    if (!user || user.type !== 'google') return;
    if (!password || password.length < 4) {
      alert("Password must be at least 4 characters.");
      return;
    }
    try {
      registerPasswordForGoogleUser(user.email, password);
      // Copy current data state to local storage for this email username
      localStorage.setItem(`farm_data_local_${user.email}`, JSON.stringify(data));
      alert(`Successfully registered offline password!\n\nEmail: ${user.email}\nPassword: ${password}\n\nAll your current crop logs have been copied over. You can now use this email/password to log in locally when Google Sign-In is blocked.`);
      setIsPasswordModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to register local offline password.");
    }
  };

  const triggerManualSync = async () => {
    if (!user || user.type !== 'google') return;
    
    setSyncStatus('syncing');
    try {
      const loaded = await loadUserData(user, googleToken);
      if (loaded.fileId) setFileId(loaded.fileId);
      
      // Save local cached changes to drive
      await saveUserData(user, data, googleToken, loaded.fileId);
      setSyncStatus('synced');
    } catch (err) {
      console.error("Manual sync failed:", err);
      setSyncStatus('error');
    }
  };

  // CRUD handlers
  const handleSaveCrop = (newCrop) => {
    const cropWithId = {
      ...newCrop,
      id: newCrop.id || `crop_${Date.now()}`
    };
    let updatedCrops;
    if (newCrop.id) {
      updatedCrops = data.crops.map(c => c.id === newCrop.id ? cropWithId : c);
    } else {
      updatedCrops = [...data.crops, cropWithId];
    }

    updateDataState({
      ...data,
      crops: updatedCrops
    });
    setSelectedCropId(cropWithId.id);
    setCurrentView('crop_details');
    setEditingCrop(null);
  };

  const handleSaveExpense = (newExpense) => {
    const expenseWithId = {
      ...newExpense,
      id: newExpense.id || `exp_${Date.now()}`
    };
    let updatedExpenses;
    if (newExpense.id) {
      updatedExpenses = data.expenses.map(e => e.id === newExpense.id ? expenseWithId : e);
    } else {
      updatedExpenses = [...data.expenses, expenseWithId];
    }

    updateDataState({
      ...data,
      expenses: updatedExpenses
    });
    setSelectedCropId(expenseWithId.cropId);
    setCurrentView('crop_details');
    setEditingExpense(null);
  };

  const handleSaveHarvest = (newHarvest) => {
    const harvestWithId = {
      ...newHarvest,
      id: newHarvest.id || `harv_${Date.now()}`
    };
    let updatedHarvests;
    if (newHarvest.id) {
      updatedHarvests = data.harvests.map(h => h.id === newHarvest.id ? harvestWithId : h);
    } else {
      updatedHarvests = [...data.harvests, harvestWithId];
    }
    
    // Mark crop as harvested only if it is a single-harvest crop scheme
    const targetCrop = data.crops.find(c => c.id === newHarvest.cropId);
    const isSingleHarvest = !targetCrop || !targetCrop.harvestType || targetCrop.harvestType === 'single';

    const updatedCrops = data.crops.map(c => {
      if (c.id === newHarvest.cropId && isSingleHarvest) {
        return { ...c, status: 'harvested' };
      }
      return c;
    });

    updateDataState({
      ...data,
      crops: updatedCrops,
      harvests: updatedHarvests
    });
    
    setSelectedCropId(newHarvest.cropId);
    setCurrentView('crop_details');
    setEditingHarvest(null);
  };

  const handleDeleteCrop = (cropId) => {
    const updatedCrops = data.crops.filter(c => c.id !== cropId);
    const updatedExpenses = data.expenses.filter(e => e.cropId !== cropId);
    const updatedHarvests = data.harvests.filter(h => h.cropId !== cropId);
    
    updateDataState({
      crops: updatedCrops,
      expenses: updatedExpenses,
      harvests: updatedHarvests
    });
    setSelectedCropId(null);
    setCurrentView('dashboard');
  };

  const handleConcludeCrop = (cropId, conclusionDate) => {
    const updatedCrops = data.crops.map(c => {
      if (c.id === cropId) {
        return { 
          ...c, 
          status: 'harvested',
          concludedDate: conclusionDate || new Date().toISOString().split('T')[0]
        };
      }
      return c;
    });
    updateDataState({
      ...data,
      crops: updatedCrops
    });
  };

  const handleDeleteExpense = (expId) => {
    const updatedExpenses = data.expenses.filter(e => e.id !== expId);
    updateDataState({
      ...data,
      expenses: updatedExpenses
    });
  };

  const handleDeleteHarvest = (harvId) => {
    const targetHarvest = data.harvests.find(h => h.id === harvId);
    const updatedHarvests = data.harvests.filter(h => h.id !== harvId);
    
    let updatedCrops = data.crops;
    if (targetHarvest) {
      const targetCrop = data.crops.find(c => c.id === targetHarvest.cropId);
      if (targetCrop && targetCrop.harvestType === 'single') {
        updatedCrops = data.crops.map(c => c.id === targetCrop.id ? { ...c, status: 'active' } : c);
      }
    }

    updateDataState({
      ...data,
      crops: updatedCrops,
      harvests: updatedHarvests
    });
  };

  // Rendering Routing Views
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            data={data} 
            onNavigate={setCurrentView}
            setSelectedCropId={setSelectedCropId}
            syncStatus={syncStatus}
            user={user}
            onTriggerInstall={handleTriggerInstall}
            deferredPrompt={deferredPrompt}
            onShowIOSInstallGuide={() => setShowIOSInstallGuide(true)}
          />
        );
      case 'crop_form':
        return (
          <CropForm 
            onSave={handleSaveCrop}
            onCancel={() => {
              setEditingCrop(null);
              setCurrentView(selectedCropId ? 'crop_details' : 'dashboard');
            }}
            editingCrop={editingCrop}
          />
        );
      case 'expense_form':
        return (
          <ExpenseForm 
            crops={data.crops}
            defaultCropId={selectedCropId}
            onSave={handleSaveExpense}
            onCancel={() => {
              setEditingExpense(null);
              setCurrentView(selectedCropId ? 'crop_details' : 'dashboard');
            }}
            editingExpense={editingExpense}
          />
        );
      case 'harvest_form':
        return (
          <HarvestForm 
            crops={data.crops}
            defaultCropId={selectedCropId}
            onSave={handleSaveHarvest}
            onCancel={() => {
              setEditingHarvest(null);
              setCurrentView(selectedCropId ? 'crop_details' : 'dashboard');
            }}
            editingHarvest={editingHarvest}
          />
        );
      case 'crop_details':
        return (
          <CropDetails 
            cropId={selectedCropId}
            data={data}
            onBack={() => {
              setSelectedCropId(null);
              setCurrentView('dashboard');
            }}
            onDeleteCrop={handleDeleteCrop}
            onDeleteExpense={handleDeleteExpense}
            onDeleteHarvest={handleDeleteHarvest}
            onConcludeCrop={handleConcludeCrop}
            onNavigate={setCurrentView}
            setSelectedCropId={setSelectedCropId}
            onEditCrop={(crop) => {
              setEditingCrop(crop);
              setCurrentView('crop_form');
            }}
            onEditExpense={(expense) => {
              setEditingExpense(expense);
              setCurrentView('expense_form');
            }}
            onEditHarvest={(harvest) => {
              setEditingHarvest(harvest);
              setCurrentView('harvest_form');
            }}
          />
        );
      case 'analytics':
        return (
          <Analytics data={data} />
        );
      case 'admin_portal':
        return (
          <AdminPortal googleToken={googleToken} onBack={() => setCurrentView('dashboard')} />
        );
      default:
        return <div className="p-6 text-center">View under development</div>;
    }
  };

  const handleTriggerInstall = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA installation');
      }
      setDeferredPrompt(null);
    });
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setFeedbackScreenshot(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      const deviceMeta = typeof navigator !== 'undefined' 
        ? `${navigator.userAgent} (${window.innerWidth}x${window.innerHeight})`
        : 'Unknown Client';
        
      await submitUserFeedback(user, feedbackMessage, feedbackScreenshot, deviceMeta);
      setFeedbackSubmitSuccess(true);
      setFeedbackMessage('');
      setFeedbackScreenshot('');
      
      setTimeout(() => {
        setIsFeedbackModalOpen(false);
        setFeedbackSubmitSuccess(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      alert("Failed to send feedback. Please check your internet connection and try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // If language is not selected yet for the session, show Language Selector overlay
  if (!isLanguageConfirmed) {
    return <LanguageSelector onConfirm={() => setIsLanguageConfirmed(true)} />;
  }

  // If user is not authenticated, show login page
  if (!user) {
    return <Login />;
  }

  // Onboarding registration / sync diagnosis overlay
  if (onboardingState !== 'idle') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans text-left transition-colors">
        {/* Decorative blur orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-200/20 dark:bg-emerald-950/15 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-100/35 dark:bg-amber-950/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

        <div className="w-full max-w-md glass-card dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center animate-scale-in">
          <div className="space-y-4">
            {onboardingState === 'registering' ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#0C9D61] border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                    Registering Account...
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    கணக்கு பதிவு செய்யப்படுகிறது... / खाता पंजीकृत किया जा रहा है...
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-450 leading-relaxed max-w-[280px] mx-auto">
                    Verifying secure database synchronization with your Google Drive backup. Please wait.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center justify-center space-y-4 animate-scale-in">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 text-[#0C9D61] rounded-full flex items-center justify-center shadow-md border border-emerald-100 dark:border-emerald-900/30 animate-bounce">
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-450">✓</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                    Registration Successful!
                  </h3>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450">
                    பதிவு வெற்றிகரமாக முடிந்தது! / पंजीकरण सफल रहा!
                  </p>
                  <p className="text-xs text-slate-650 dark:text-slate-350 font-bold bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 p-3 rounded-xl max-w-[320px] mx-auto leading-relaxed">
                    User <span className="underline font-extrabold text-slate-800 dark:text-white">{user?.email}</span> was registered successfully.
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-450 leading-relaxed max-w-[290px] mx-auto pt-2">
                    To finalize the drive sync setup, you will be logged out now. On your next sign-in, please check the permission checkbox.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If Google sync failed due to permissions and onboarding is idle, redirect to logout to clear the session
  if (user && user.type === 'google' && syncStatus === 'error' && onboardingState === 'idle') {
    handleLogout();
    return null;
  }

  // Gated Developer Admin Portal Workspace
  if (user && user.email === 'iniansarathi2003@gmail.com') {
    return (
      <div className={`min-h-screen flex flex-col w-full max-w-lg md:max-w-6xl mx-auto md:border-x md:border-slate-200 md:shadow-md relative overflow-y-auto overflow-x-hidden scrollbar-none transition-all duration-300 ${
        theme === 'dark' ? 'dark bg-slate-905 bg-slate-950 text-slate-100 md:border-slate-800' : 'bg-slate-50 text-slate-800'
      }`}>
        <AdminPortal 
          googleToken={googleToken} 
          onLogout={handleLogout} 
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        />
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="flex flex-col h-screen bg-slate-50 w-full max-w-lg md:max-w-6xl mx-auto md:border-x md:border-slate-200 md:shadow-md relative overflow-y-auto overflow-x-hidden scrollbar-none transition-all duration-300">
      
      {/* Top Header */}
      <Header 
        user={user} 
        syncStatus={syncStatus} 
        onTriggerSync={triggerManualSync}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onLogout={handleLogout}
        onSetupLocalPassword={() => setIsPasswordModalOpen(true)}
      />

      {/* Horizontal Sub-Navbar (Navigation below the top nav bar) */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2 sm:px-6 flex items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none shrink-0 shadow-sm">
        <button
          onClick={() => { setSelectedCropId(null); setCurrentView('dashboard'); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            currentView === 'dashboard'
              ? 'bg-emerald-50 text-emerald-800 font-bold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Home size={13} />
          <span>{t('sidebar.nav_home')}</span>
        </button>

        <button
          onClick={() => setCurrentView('crop_form')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            currentView === 'crop_form'
              ? 'bg-emerald-50 text-emerald-800 font-bold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Sprout size={13} />
          <span>{t('sidebar.nav_crop')}</span>
        </button>

        <button
          onClick={() => setCurrentView('analytics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            currentView === 'analytics'
              ? 'bg-emerald-50 text-emerald-800 font-bold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BarChart3 size={13} />
          <span>{t('sidebar.nav_analytics')}</span>
        </button>
      </div>

      {/* Slide-out Left Sidebar Drawer (Toggled by hamburger icon on both mobile & desktop) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        syncStatus={syncStatus}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
        onSwitchGoogleAccount={handleSwitchGoogleAccount}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        deferredPrompt={deferredPrompt}
        onTriggerInstall={handleTriggerInstall}
        onShowIOSInstallGuide={() => setShowIOSInstallGuide(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onRequestDeleteAccount={handleRequestDeleteAccount}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col pb-4 md:pb-6">
        {renderView()}
      </main>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl text-left space-y-4 animate-scale-in">
            <div className="flex items-center gap-2 text-emerald-800">
              <span className="text-xl">🔑</span>
              <h3 className="font-display font-bold text-lg m-0">Link Offline Password</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Create a password to secure your data locally. You can use your email ID (<strong>{user?.email}</strong>) and this password to log in directly when Google Sign-in is blocked. All your current data will be copied to your local account.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const pwd = e.target.elements.localPassword.value;
                handleLinkLocalPassword(pwd);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="localPassword"
                  required
                  placeholder="At least 4 characters"
                  minLength={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 font-semibold text-xs transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all cursor-pointer text-center shadow-md shadow-emerald-100"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* iOS PWA Install Guide Modal */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl text-left space-y-4 animate-scale-in">
            <div className="flex items-center gap-2 text-emerald-800">
              <span className="text-xl">📲</span>
              <h3 className="font-display font-extrabold text-sm tracking-tight m-0">
                Install on iPhone / iPad
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              To install <strong>FarmAccountant</strong> on your iOS device screen, please follow these simple steps inside your Safari browser:
            </p>

            <ol className="space-y-3 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-extrabold">1</span>
                <span>Tap the <strong>Share</strong> button <span className="inline-block bg-slate-100 px-1 py-0.5 rounded text-sm">📤</span> at the bottom of the browser screen.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-extrabold">2</span>
                <span>Scroll down the menu and select <strong>"Add to Home Screen"</strong> <span className="inline-block bg-slate-100 px-1.5 py-0.5 rounded font-extrabold text-sm font-sans">＋</span>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-extrabold">3</span>
                <span>Tap <strong>"Add"</strong> in the top-right corner to complete the installation!</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all cursor-pointer text-center shadow-md shadow-emerald-100"
            >
              Got it
            </button>
          </div>
        </div>
      )}
      {/* Feedback Submission Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl text-left space-y-4 animate-scale-in">
            <div className="flex items-center justify-between text-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <h3 className="font-display font-extrabold text-sm tracking-tight m-0">
                  Send Feedback
                </h3>
              </div>
              {!isSubmittingFeedback && !feedbackSubmitSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    setIsFeedbackModalOpen(false);
                    setFeedbackMessage('');
                    setFeedbackScreenshot('');
                  }}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {feedbackSubmitSuccess ? (
              <div className="py-6 text-center space-y-2">
                <span className="text-4xl">🎉</span>
                <h4 className="font-bold text-emerald-800 text-sm">Feedback Sent!</h4>
                <p className="text-xs text-slate-500">Thank you for helping us improve FarmAccountant.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Your Message
                  </label>
                  <textarea
                    required
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Describe your issue, suggestion, or request here..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Attach Screenshot (Optional)
                  </label>
                  <div className="mt-1 flex items-center justify-center border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-all relative">
                    {feedbackScreenshot ? (
                      <div className="relative w-full flex flex-col items-center">
                        <img
                          src={feedbackScreenshot}
                          alt="Screenshot preview"
                          className="max-h-24 object-contain rounded-lg border border-slate-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setFeedbackScreenshot('')}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow hover:bg-rose-600 cursor-pointer"
                          title="Remove screenshot"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-emerald-700 transition-colors">
                        <span className="text-2xl">📸</span>
                        <span className="text-[10px] font-bold mt-1">Upload image or take photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isSubmittingFeedback}
                    onClick={() => {
                      setIsFeedbackModalOpen(false);
                      setFeedbackMessage('');
                      setFeedbackScreenshot('');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 font-semibold text-xs transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback || !feedbackMessage.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all cursor-pointer text-center shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Submit</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
