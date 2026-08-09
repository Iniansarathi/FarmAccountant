import React, { useState, useEffect, useCallback } from 'react';
import { Users, MessageSquare, Monitor, Calendar, Search, ArrowLeft, Image as ImageIcon, Trash2, LogOut, RefreshCw } from 'lucide-react';
import { fetchAdminPortalData, approveDeletion } from '../services/adminApi';

export default function AdminPortal({ googleToken, onBack, onLogout, theme, onToggleTheme }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'feedbacks', 'deletions'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ users: [], feedbacks: [], deletionRequests: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // Track email being deleted
  const [selectedScreenshot, setSelectedScreenshot] = useState(null); // Lightbox image source

  const loadPortalData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAdminPortalData(googleToken);
      // Ensure result structure is completely safe
      if (result && result.error) {
        setError(result.error);
      } else {
        setData({
          users: result?.users || [],
          feedbacks: result?.feedbacks || [],
          deletionRequests: result?.deletionRequests || []
        });
      }
    } catch (err) {
      console.error(err);
      setError("Access Denied or Connection Failed. Please ensure you are logged in using iniansarathi2003@gmail.com and your Apps Script Web App is deployed.");
    } finally {
      setLoading(false);
    }
  }, [googleToken]);

  useEffect(() => {
    loadPortalData();
  }, [googleToken, loadPortalData]);

  const filteredUsers = (data?.users || []).filter(u => 
    (u?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeedbacks = (data?.feedbacks || []).filter(f => 
    (f?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (f?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f?.message || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeletions = (data?.deletionRequests || []).filter(req => {
    const email = typeof req === 'string' ? req : (req?.email || '');
    const name = typeof req === 'string' ? '' : (req?.name || '');
    return email.toLowerCase().includes(searchQuery.toLowerCase()) || 
           name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDeleteUser = async (email, isFromPendingRequest = false) => {
    const confirmMsg = isFromPendingRequest
      ? `Are you sure you want to approve deletion for ${email}? This will centrally clear their profile registration.`
      : `Are you sure you want to permanently delete the farmer account for ${email}? This will wipe their central database registration row, and trigger an automatic local wipe when they next connect.`;
      
    if (!window.confirm(confirmMsg)) return;
    
    setActionLoading(email);
    try {
      await approveDeletion(email, googleToken);
      alert(`Account ${email} has been successfully deleted centrally.`);
      
      setData(prev => ({
        ...prev,
        deletionRequests: (prev.deletionRequests || []).filter(req => {
          const reqEmail = typeof req === 'string' ? req : (req.email || '');
          return reqEmail !== email;
        }),
        users: (prev.users || []).filter(u => u.email !== email)
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to delete account: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="flex-1 px-4 py-6 sm:px-6 max-w-4xl mx-auto w-full space-y-6 text-left">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer mr-1"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <img 
            src="/admin_logo.jpg" 
            alt="Admin Portal Logo" 
            className="w-9 h-9 rounded-xl border border-slate-150 dark:border-slate-800 shadow-inner object-cover"
          />
          <div>
            <h2 className="font-display font-extrabold text-base text-slate-850 dark:text-slate-100 tracking-tight m-0">
              Developer Admin Portal
            </h2>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-450 font-semibold mt-0.5"> Gated: iniansarathi2003@gmail.com</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data.isMock && (
            <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
              Simulated Sandbox Mode
            </span>
          )}
          <button
            onClick={loadPortalData}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 text-[10px] font-bold hover-scale hover-scale-active transition-all cursor-pointer shadow-sm disabled:opacity-55"
            title="Refresh Data"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 text-[10px] font-bold hover-scale hover-scale-active transition-all cursor-pointer shadow-sm"
              title="Toggle Theme"
            >
              <span>{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[10px] font-bold hover-scale hover-scale-active transition-all cursor-pointer shadow-sm"
            >
              <LogOut size={11} />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {data.isMock && (
        <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1 transition-colors">
          <p className="font-bold flex items-center gap-1">⚠️ Running in Simulated Sandbox Mode</p>
          <p className="leading-relaxed font-medium">
            To view the real active emails of registered farmers and feedback rows, please deploy your Google Apps Script Web App (as detailed in the <code className="bg-amber-100 dark:bg-amber-950/50 px-1 py-0.5 rounded text-[11px]">GOOGLE_APPS_SCRIPT_GUIDE.md</code> file in your repository) and add the <code className="bg-amber-100 dark:bg-amber-950/50 px-1 py-0.5 rounded text-[11px]">VITE_ADMIN_API_URL</code> environment variable on your Vercel Dashboard, then redeploy the site.
          </p>
        </div>
      )}

      {error ? (
        <div className="bg-rose-50 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4 text-xs text-rose-800 dark:text-rose-200 font-medium">
          ⚠️ {error}
        </div>
      ) : loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#0C9D61] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Loading admin records...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-[#0C9D61] flex items-center justify-center shadow-inner">
                <Users size={20} />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Registered Farmers</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-0.5 block">{data.users.length}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 flex items-center justify-center shadow-inner">
                <MessageSquare size={20} />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Feedback Logs</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-0.5 block">{data.feedbacks.length}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 flex items-center justify-center shadow-inner">
                <Trash2 size={20} />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Delete Requests</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-display mt-0.5 block">{(data.deletionRequests || []).length}</span>
              </div>
            </div>
          </div>

          {/* Tab Switcher & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'users' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Farmers List
              </button>
              <button
                onClick={() => { setActiveTab('feedbacks'); setSearchQuery(''); }}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'feedbacks' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Feedback Log ({filteredFeedbacks.length})
              </button>
              <button
                onClick={() => { setActiveTab('deletions'); setSearchQuery(''); }}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'deletions' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Delete Requests ({(data.deletionRequests || []).length})
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64 flex items-center">
              <Search size={13} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  activeTab === 'users' 
                    ? "Search users by name/email..." 
                    : activeTab === 'feedbacks'
                    ? "Search feedbacks..."
                    : "Search deletion requests..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner transition-all"
              />
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === 'users' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800/80">
                      <th className="px-6 py-3.5">Farmer Profile</th>
                      <th className="px-6 py-3.5">Email Address</th>
                      <th className="px-6 py-3.5 text-center">Drive Sync Permission</th>
                      <th className="px-6 py-3.5 text-right">Last Sync Timestamp</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">No registered farmers found matching query.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            {u.picture ? (
                              <img 
                                src={u.picture} 
                                alt={u.name} 
                                className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-800 shadow-inner" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-[#0C9D61] dark:text-emerald-450 font-bold flex items-center justify-center">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{u.name}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{u.email}</td>
                          <td className="px-6 py-4 text-center">
                            {u.hasDrivePermission === false || u.hasDrivePermission === 'No' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-55 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30 shadow-sm">
                                ⚠️ Denied / Not Synced
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-[#0C9D61] dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                                🟢 Granted / Synced
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-400 dark:text-slate-500 font-semibold">{formatDate(u.lastLogin)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              disabled={actionLoading === u.email}
                              onClick={() => handleDeleteUser(u.email, false)}
                              className="p-1.5 rounded-lg text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-55 transition-colors cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 shadow-sm"
                              title="Delete Farmer Centrally"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'feedbacks' ? (
            <div className="space-y-4">
              {filteredFeedbacks.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm py-12 text-center text-slate-400 dark:text-slate-500 italic text-xs transition-colors">
                  No feedback logs matching query.
                </div>
              ) : (
                filteredFeedbacks.map((f, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">{f.name}</h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">{f.email}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 bg-slate-55 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-805 flex items-center gap-1">
                        <Calendar size={10} /> {formatDate(f.timestamp)}
                      </span>
                    </div>

                    {/* Text Message */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850/80">
                      {f.message}
                    </p>

                    {/* Screenshot attachment preview */}
                    {f.screenshot && (
                      <div className="flex flex-col items-start space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <ImageIcon size={10} /> Attached Screenshot
                        </span>
                        <div 
                          onClick={() => setSelectedScreenshot(f.screenshot)}
                          className="relative max-w-[200px] rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm group cursor-zoom-in"
                        >
                          <img 
                            src={f.screenshot} 
                            alt="Attachment preview" 
                            className="max-h-24 object-contain transition-transform group-hover:scale-103"
                          />
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 flex items-center justify-center transition-all">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-[10px] font-bold bg-slate-900/70 px-2 py-1 rounded">View Full Size</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Meta device specs */}
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1 pt-1.5 border-t border-slate-50 dark:border-slate-850/80">
                      <Monitor size={10} /> {f.device}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800/80">
                      <th className="px-6 py-3.5">Email Address</th>
                      <th className="px-6 py-3.5">Requester Info</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs">
                    {filteredDeletions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">No deletion requests pending.</td>
                      </tr>
                    ) : (
                      filteredDeletions.map((req, idx) => {
                        const email = typeof req === 'string' ? req : (req.email || '');
                        const name = typeof req === 'string' ? 'Google Account User' : (req.name || 'Google Account User');
                        const isDeleting = actionLoading === email;
                        
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">{email}</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-450 font-medium">{name}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                disabled={isDeleting}
                                onClick={() => handleDeleteUser(email, true)}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[10px] shadow-sm transition-all cursor-pointer ${
                                  isDeleting 
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700' 
                                    : 'bg-rose-600 text-white hover:bg-rose-700 hover-scale'
                                }`}
                              >
                                {isDeleting ? "Processing..." : "Approve Deletion"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lightbox Modal for Full Screenshot Preview */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <button 
            onClick={() => setSelectedScreenshot(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer shadow hover:bg-slate-700"
            title="Close Lightbox"
          >
            ✕
          </button>
          <img 
            src={selectedScreenshot} 
            alt="Full size screenshot" 
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-800"
          />
        </div>
      )}
    </div>
  );
}
