import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Monitor, Calendar, Search, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { fetchAdminPortalData } from '../services/adminApi';

export default function AdminPortal({ googleToken, onBack }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'feedbacks'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ users: [], feedbacks: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScreenshot, setSelectedScreenshot] = useState(null); // Lightbox image source

  useEffect(() => {
    const loadPortalData = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetchAdminPortalData(googleToken);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Access Denied or Connection Failed. Please ensure you are logged in using iniansarathi2003@gmail.com and your Apps Script Web App is deployed.");
      } finally {
        setLoading(false);
      }
    };
    loadPortalData();
  }, [googleToken]);

  const filteredUsers = data.users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeedbacks = data.feedbacks.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="font-display font-extrabold text-lg text-slate-800 tracking-tight m-0">
              Developer Admin Portal
            </h2>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5"> Gated: iniansarathi2003@gmail.com</p>
          </div>
        </div>

        {data.isMock && (
          <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
            Simulated Sandbox Mode
          </span>
        )}
      </div>

      {data.isMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1">⚠️ Running in Simulated Sandbox Mode</p>
          <p className="leading-relaxed font-medium">
            To view the real active emails of registered farmers and feedback rows, please deploy your Google Apps Script Web App (as detailed in the <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">GOOGLE_APPS_SCRIPT_GUIDE.md</code> file in your repository) and add the <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">VITE_ADMIN_API_URL</code> environment variable on your Vercel Dashboard, then redeploy the site.
          </p>
        </div>
      )}

      {error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 font-medium">
          ⚠️ {error}
        </div>
      ) : loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#0C9D61] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Loading admin records...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0C9D61] flex items-center justify-center shadow-inner">
                <Users size={20} />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Farmers</span>
                <span className="text-xl font-extrabold text-slate-800 font-display mt-0.5 block">{data.users.length}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                <MessageSquare size={20} />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feedback Logs</span>
                <span className="text-xl font-extrabold text-slate-800 font-display mt-0.5 block">{data.feedbacks.length}</span>
              </div>
            </div>
          </div>

          {/* Tab Switcher & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Farmers List
              </button>
              <button
                onClick={() => { setActiveTab('feedbacks'); setSearchQuery(''); }}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'feedbacks' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Feedback Log ({filteredFeedbacks.length})
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64 flex items-center">
              <Search size={13} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={activeTab === 'users' ? "Search users by name/email..." : "Search feedbacks..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner transition-all"
              />
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === 'users' ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                      <th className="px-6 py-3.5">Farmer Profile</th>
                      <th className="px-6 py-3.5">Email Address</th>
                      <th className="px-6 py-3.5 text-right">Last Sync Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">No registered farmers found matching query.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            {u.picture ? (
                              <img 
                                src={u.picture} 
                                alt={u.name} 
                                className="w-8 h-8 rounded-full border border-slate-100 shadow-inner" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0C9D61] font-bold flex items-center justify-center">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-slate-700">{u.name}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{u.email}</td>
                          <td className="px-6 py-4 text-right text-slate-400 font-semibold">{formatDate(u.lastLogin)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFeedbacks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center text-slate-400 italic text-xs">
                  No feedback logs matching query.
                </div>
              ) : (
                filteredFeedbacks.map((f, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-xs">{f.name}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold block">{f.email}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                        <Calendar size={10} /> {formatDate(f.timestamp)}
                      </span>
                    </div>

                    {/* Text Message */}
                    <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      {f.message}
                    </p>

                    {/* Screenshot attachment preview */}
                    {f.screenshot && (
                      <div className="flex flex-col items-start space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <ImageIcon size={10} /> Attached Screenshot
                        </span>
                        <div 
                          onClick={() => setSelectedScreenshot(f.screenshot)}
                          className="relative max-w-[200px] rounded-lg overflow-hidden border border-slate-100 shadow-sm group cursor-zoom-in"
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
                    <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1 pt-1.5 border-t border-slate-50">
                      <Monitor size={10} /> {f.device}
                    </div>
                  </div>
                ))
              )}
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
