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

// Services
import { initGoogleOAuth, fetchGoogleUserInfo, getStoredGoogleToken, clearAuthSession, requestGoogleToken } from './services/auth';
import { loadUserData, saveUserData } from './services/storage';

export default function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [googleToken, setGoogleToken] = useState(null);
  const [fileId, setFileId] = useState(null);
  
  // App states
  const [data, setData] = useState({ crops: [], expenses: [], harvests: [] });
  const [syncStatus, setSyncStatus] = useState('local'); // 'local', 'synced', 'syncing', 'unsaved', 'error'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'crop_form', 'expense_form', 'harvest_form', 'crop_details', 'analytics'
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingHarvest, setEditingHarvest] = useState(null);
  const scrollContainerRef = useRef(null);

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
          // Token expired, set sync status to unsaved/local until they authenticate again
          setSyncStatus('unsaved');
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

  // Fetch/load user data when user changes
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setSyncStatus(user.type === 'google' ? 'syncing' : 'local');
      try {
        const loaded = await loadUserData(user, googleToken);
        if (loaded.error === 'permission_denied') {
          setSyncStatus('error');
          alert("Google Drive access permission was not granted! Please log out, sign in with Google again, and make sure to CHECK the box allowing the app to view and manage its own files on Google Drive.");
        } else {
          setData(loaded.data || { crops: [], expenses: [], harvests: [] });
          if (loaded.fileId) setFileId(loaded.fileId);
          setSyncStatus(user.type === 'google' ? 'synced' : 'local');
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setSyncStatus(user.type === 'google' ? 'error' : 'local');
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
  const handleAuthSuccess = (loggedUser) => {
    setUser(loggedUser);
    localStorage.setItem('farm_current_user', JSON.stringify(loggedUser));
    if (loggedUser.type === 'google') {
      setSyncStatus('synced');
    } else {
      setSyncStatus('local');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setData({ crops: [], expenses: [], harvests: [] });
    setGoogleToken(null);
    setFileId(null);
    localStorage.removeItem('farm_current_user');
    setCurrentView('dashboard');
  };

  const handleSwitchGoogleAccount = () => {
    setIsSidebarOpen(false);
    requestGoogleToken();
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
    
    // Mark crop as harvested
    const updatedCrops = data.crops.map(c => {
      if (c.id === newHarvest.cropId) {
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

  const handleDeleteExpense = (expId) => {
    const updatedExpenses = data.expenses.filter(e => e.id !== expId);
    updateDataState({
      ...data,
      expenses: updatedExpenses
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
      default:
        return <div className="p-6 text-center">View under development</div>;
    }
  };

  // If user is not authenticated, show login page
  if (!user) {
    return <Login onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div ref={scrollContainerRef} className="flex flex-col h-screen bg-slate-50 w-full max-w-lg md:max-w-6xl mx-auto md:border-x md:border-slate-200 md:shadow-md relative overflow-y-auto scrollbar-none transition-all duration-300">
      
      {/* Top Header */}
      <Header 
        user={user} 
        syncStatus={syncStatus} 
        onTriggerSync={triggerManualSync}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onLogout={handleLogout}
      />

      {/* Horizontal Sub-Navbar (Navigation below the top nav bar) */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2 sm:px-6 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none shrink-0 shadow-sm">
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
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col pb-4 md:pb-6">
        {renderView()}
      </main>
    </div>
  );
}
