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
import InstallOverlay from './components/InstallOverlay';

// Services
import { initGoogleOAuth, fetchGoogleUserInfo, getStoredGoogleToken, clearAuthSession, requestGoogleToken, registerPasswordForGoogleUser, revokeGoogleToken } from './services/auth';
import { loadUserData, saveUserData } from './services/storage';
import { submitUserFeedback, sendUserHeartbeat, requestDeletion, checkUserRegistration, markNotificationRead } from './services/adminApi';

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
  const [activeNotification, setActiveNotification] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [hasSkippedInstall, setHasSkippedInstall] = useState(false);
  const [isSuccessfullyInstalled, setIsSuccessfullyInstalled] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', mobile: '', state: '', district: '', area: '', pincode: '' });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
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
          // Token expired, but do NOT clear the session!
          // Run in local/cached mode first and trigger silent re-authentication in the background
          setGoogleToken(null);
          setSyncStatus('local');
          
          // Request a new token silently in the background using their email
          setTimeout(() => {
            requestGoogleToken(false, parsedUser.email);
          }, 1000);
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
    if (user.type === 'google' && !googleToken) return;
    
    let active = true;
    let timer1 = null;
    let timer2 = null;

    const fetchData = async () => {
      // For developer account, bypass onboarding
      if (user.email === 'iniansarathi2003@gmail.com') {
        if (active) setSyncStatus('synced');
        return;
      }

      // Check if user has successfully synced on this device before
      const localRegFlag = localStorage.getItem(`farm_registered_${user.email}`);
      const isNewUserOnDevice = localRegFlag !== 'true';

      if (user.type === 'google' && isNewUserOnDevice) {
        if (active) setOnboardingState('checking');
      }
      if (active) setSyncStatus(user.type === 'google' ? 'syncing' : 'local');
      
      const startTime = Date.now();

      // Quick central check to see if they are blocked by the administrator, have notifications, or need profile setup
      if (user && user.email) {
        try {
          const checkRes = await checkUserRegistration(user.email);
          if (checkRes) {
            if (checkRes.blocked === true) {
              if (active) {
                const targetFileId = localStorage.getItem('google_drive_file_id') || null;
                await performRemoteWipe(user, targetFileId, googleToken);
              }
              return;
            }
            // If they have unread notifications from the admin, load the first one
            if (checkRes.notifications && checkRes.notifications.length > 0) {
              if (active) {
                setActiveNotification(checkRes.notifications[0]);
              }
            }
            // Check if profile setup is completed (centrally or locally)
            const isLocalProfileSetup = localStorage.getItem(`farm_profile_setup_${user.email}`) === 'true';
            if (!checkRes.mobile && !isLocalProfileSetup) {
              if (active) {
                setProfileForm(prev => ({ ...prev, name: user.name || '' }));
                setShowProfileSetup(true);
              }
            } else if (checkRes.mobile) {
              // Synchronize local storage state flag if centrally completed
              localStorage.setItem(`farm_profile_setup_${user.email}`, 'true');
            }
          }
        } catch (err) {
          console.warn("Failed central block check on startup", err);
        }
      }

      try {
        const loaded = await loadUserData(user, googleToken);
        if (!active) return;
        
        if (loaded && loaded.error === 'permission_denied') {
          // Check if they are registered centrally or if they have logged in before
          const isRegistered = localStorage.getItem(`farm_registered_${user.email}`) === 'true';
          
          if (!isRegistered) {
            // New user registration flow with permission denied
            if (user.type === 'google' && googleToken) {
              const res = await sendUserHeartbeat(user, googleToken, false);
              if (res && res.blocked === true) {
                if (active) await performRemoteWipe(user, null, googleToken);
                return;
              }
            }
            if (active) setOnboardingState('registering');
            
            const elapsedTime = Date.now() - startTime;
            const delay = Math.max(0, 3000 - elapsedTime);
            
            timer1 = setTimeout(() => {
              if (!active) return;
              setOnboardingState('success');
              
              // Play success overlay for 2 seconds then logout
              timer2 = setTimeout(() => {
                if (!active) return;
                handleLogout();
              }, 2000);
            }, delay);
          } else {
            // Existing user: direct logout callback to prompt GIS consent checkboxes again
            setSyncStatus('error');
            handleLogout();
          }
          return;
        }
        
        // If the file did not exist in Drive, they are a brand new registering user
        const isActuallyNew = loaded.isNewFile === true;

        if (isNewUserOnDevice && isActuallyNew) {
          // New User Registration Flow (permissions granted)
          // 1. Send registration heartbeat centrally
          if (user.type === 'google' && googleToken) {
            const res = await sendUserHeartbeat(user, googleToken, true);
            if (res && res.blocked === true) {
              if (active) await performRemoteWipe(user, null, googleToken);
              return;
            }
          }
          if (active) setOnboardingState('registering');
          
          // 2. Play "Registering..." for exactly 3 seconds
          const elapsedTime = Date.now() - startTime;
          const delay = Math.max(0, 3000 - elapsedTime);
          
          timer1 = setTimeout(() => {
            if (!active) return;
            setOnboardingState('success');
            
            // 3. Play "Registration Successful!" for exactly 2 seconds, then logout
            timer2 = setTimeout(() => {
              if (!active) return;
              // Mark as registered so next login bypasses onboarding and logs in normally
              localStorage.setItem(`farm_registered_${user.email}`, 'true');
              handleLogout();
            }, 2000);
          }, delay);
        } else {
          // Normal login for existing users
          setData(loaded.data || { crops: [], expenses: [], harvests: [] });
          if (loaded.fileId) setFileId(loaded.fileId);
          setSyncStatus(user.type === 'google' ? 'synced' : 'local');
          localStorage.setItem(`farm_registered_${user.email}`, 'true'); // Flag existing user locally
          setOnboardingState('idle');

          // Send background heartbeat to ensure early users are registered in Admin Portal
          if (user.type === 'google' && googleToken) {
            sendUserHeartbeat(user, googleToken, true)
              .then(res => {
                if (res && res.blocked === true) {
                  performRemoteWipe(user, loaded.fileId, googleToken);
                }
              })
              .catch(err => console.warn("Background heartbeat failed:", err));
          }
        }
      } catch (err) {
        if (!active) return;
        console.error("Failed to fetch data:", err);
        setSyncStatus(user.type === 'google' ? 'error' : 'local');
        setOnboardingState('idle');
      }
    };
    
    fetchData();

    return () => {
      active = false;
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
    };
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

  const performRemoteWipe = async (targetUser, targetFileId, targetToken) => {
    // 1. Delete backup database file from Drive if possible
    if (targetFileId && targetToken) {
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${targetFileId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${targetToken}` }
        });
      } catch (err) {
        console.error("Failed to delete remote file during wipe:", err);
      }
    }
    
    // 2. Revoke Google OAuth token
    if (targetToken) {
      try {
        await revokeGoogleToken(targetToken);
      } catch (err) {
        console.error("Failed to revoke token during wipe:", err);
      }
    }
    
    // 3. Clear local storage and state
    localStorage.removeItem(`farm_data_google_${targetUser.email}`);
    localStorage.removeItem(`farm_registered_${targetUser.email}`);
    localStorage.removeItem('google_drive_file_id');
    localStorage.removeItem('farm_current_user');
    
    // Clear React Auth Session
    clearAuthSession();
    setUser(null);
    setData({ crops: [], expenses: [], harvests: [] });
    setGoogleToken(null);
    setFileId(null);
    setOnboardingState('idle');
    setCurrentView('dashboard');
    
    alert("Your account has been deleted by the administrator. All data has been wiped.");
  };

  // Auth Operations

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setData({ crops: [], expenses: [], harvests: [] });
    setGoogleToken(null);
    setFileId(null);
    setOnboardingState('idle');
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.mobile.trim() || !profileForm.state.trim() || !profileForm.district.trim() || !profileForm.area.trim() || !profileForm.pincode.trim()) {
      alert("Please fill in all the profile details.");
      return;
    }
    
    setIsSubmittingProfile(true);
    try {
      // Send details centrally using heartbeat
      await sendUserHeartbeat(user, googleToken, user.type === 'google', profileForm);
      
      // Save local flag
      localStorage.setItem(`farm_profile_setup_${user.email}`, 'true');
      
      // Update user state if name changed
      if (profileForm.name !== user.name) {
        const updatedLocalUser = { ...user, name: profileForm.name };
        setUser(updatedLocalUser);
        localStorage.setItem('farm_user', JSON.stringify(updatedLocalUser));
      }
      
      setShowProfileSetup(false);
    } catch (err) {
      console.error(err);
      alert("Failed to submit profile details: " + err.message);
    } finally {
      setIsSubmittingProfile(false);
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
            {onboardingState === 'checking' ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-4 animate-pulse">
                <div className="w-12 h-12 border-4 border-[#0C9D61] border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                    Checking Account...
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    கணக்கு சரிபார்க்கப்படுகிறது... / खाता सत्यापित किया जा रहा है...
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-450 leading-relaxed max-w-[280px] mx-auto">
                    Retrieving your profile authentication and credentials from the secure ledger. Please wait.
                  </p>
                </div>
              </div>
            ) : onboardingState === 'registering' ? (
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

  // PWA Install Overlay (if in browser mode and hasn't skipped yet)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const showInstallOverlay = user && !isStandalone && !hasSkippedInstall && !showProfileSetup && onboardingState === 'idle';

  if (showInstallOverlay) {
    return (
      <InstallOverlay 
        onSkip={() => setHasSkippedInstall(true)} 
        deferredPrompt={deferredPrompt}
        setDeferredPrompt={setDeferredPrompt}
        isSuccessfullyInstalled={isSuccessfullyInstalled}
        setIsSuccessfullyInstalled={setIsSuccessfullyInstalled}
      />
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

      {/* Administrator Notification Modal Popup */}
      {activeNotification && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-150 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-2.5 text-slate-850 dark:text-white">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#0C9D61] dark:text-emerald-450 flex items-center justify-center font-bold text-base shadow-sm">
                📢
              </div>
              <div>
                <h3 className="font-display font-extrabold text-sm tracking-tight m-0 leading-none">
                  Message from Admin
                </h3>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 block uppercase tracking-wider">
                  நிர்வாகியிடமிருந்து செய்தி / संदेश
                </span>
              </div>
            </div>

            {activeNotification.originalFeedback && (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-850/60 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-1.5 mb-1.5">
                  <span className="text-[9px] font-extrabold text-[#0C9D61] dark:text-emerald-450 uppercase tracking-wider block">Your Feedback / உங்கள் கருத்து:</span>
                  {activeNotification.originalTimestamp && (
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">
                      {(() => {
                        try {
                          const d = new Date(activeNotification.originalTimestamp);
                          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        } catch {
                          return '';
                        }
                      })()}
                    </span>
                  )}
                </div>
                
                <p className="italic leading-relaxed text-slate-655 dark:text-slate-300 font-semibold text-xs">
                  "{activeNotification.originalFeedback}"
                </p>

                {activeNotification.originalScreenshot && (
                  <div className="pt-2">
                    <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Attached Screenshot:</span>
                    <div className="relative max-w-[120px] rounded-lg overflow-hidden border border-slate-150 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-950">
                      <img 
                        src={activeNotification.originalScreenshot} 
                        alt="Feedback Attachment" 
                        className="max-h-16 object-contain mx-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1 text-slate-800 dark:text-white">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Response / பதில் / उत्तर:</span>
              <p className="text-xs font-semibold leading-relaxed bg-emerald-50/30 dark:bg-emerald-950/10 p-3.5 rounded-xl border border-emerald-100/30 dark:border-emerald-900/20 italic">
                "{activeNotification.message}"
              </p>
            </div>

            <button
              onClick={async () => {
                const notif = activeNotification;
                setActiveNotification(null); // Dismiss immediately in UI
                if (user && user.email) {
                  try {
                    await markNotificationRead(user.email, notif.timestamp);
                  } catch (err) {
                    console.error("Failed to dismiss notification centrally:", err);
                  }
                }
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer text-center shadow-md shadow-emerald-100 hover-scale"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {/* Unskippable Profile Setup Overlay */}
      {showProfileSetup && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in text-left overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-150 dark:border-slate-800 shadow-2xl space-y-5 animate-scale-in my-8">
            <div className="flex items-center gap-2.5 text-slate-850 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#0C9D61] dark:text-emerald-450 flex items-center justify-center font-bold text-lg shadow-sm">
                🌾
              </div>
              <div>
                <h3 className="font-display font-extrabold text-sm tracking-tight m-0 leading-none">
                  Farmer Profile Setup
                </h3>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 block uppercase tracking-wider">
                  விவசாயி சுயவிவரம் / किसान प्रोफ़ाइल
                </span>
              </div>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              Please complete your profile to access your crop accounts dashboard. This is a one-time setup.
              <span className="block mt-1 text-[9px] text-[#0C9D61] dark:text-emerald-450 font-bold">
                (டாஷ்போர்டை அணுக உங்கள் சுயவிவரத்தை பூர்த்தி செய்யவும் / कृपया अपनी प्रोफ़ाइल पूरी करें)
              </span>
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Full Name / முழு பெயர் / पूरा नाम
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Mobile Number / கைபேசி எண் / मोबाइल नंबर
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={profileForm.mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setProfileForm(prev => ({ ...prev, mobile: val }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* State */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    State / மாநிலம் / राज्य
                  </label>
                  <select
                    required
                    value={profileForm.state}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                  >
                    <option value="" disabled>Select State</option>
                    <option value="Tamil Nadu">Tamil Nadu (தமிழ்நாடு)</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Karnataka">Karnataka (கர்நாடகா)</option>
                    <option value="Kerala">Kerala (கேரளா)</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Bihar">Bihar</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Other">Other State</option>
                  </select>
                </div>

                {/* District */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    District / மாவட்டம் / जिला
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madurai"
                    value={profileForm.district}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Area / Village */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Area (Village) / பகுதி / गाँव
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Melur"
                    value={profileForm.area}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, area: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                  />
                </div>

                {/* Pincode */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Pincode / குறியீடு / पिनकोड
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="e.g. 625106"
                    value={profileForm.pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setProfileForm(prev => ({ ...prev, pincode: val }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer text-center shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
              >
                {isSubmittingProfile ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <span>Save & Continue / சேமித்து தொடரவும்</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
