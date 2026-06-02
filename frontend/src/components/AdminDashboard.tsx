import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, Key, Check, X, LogOut, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface Review {
  id: string;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  recommendationText: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface AdminDashboardProps {
  backendUrl: string;
  onStatusChange?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ backendUrl, onStatusChange }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchReviews();
    }
  }, [token, statusFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const response = await fetch(`${backendUrl}/api/reviews/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setPassword('');
      showToast('Logged in successfully!');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setReviews([]);
    showToast('Logged out successfully.');
  };

  const fetchReviews = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/reviews/admin?status=${statusFilter}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid
        handleLogout();
        setLoginError('Session expired. Please log in again.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load reviews.');
      }

      const data = await response.json();
      setReviews(data);
    } catch (err: any) {
      console.error(err);
      showToast('Error loading reviews database.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    if (!token) return;
    setActioningId(id);
    try {
      const response = await fetch(`${backendUrl}/api/reviews/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update review status.');
      }

      showToast(`Review successfully ${newStatus === 'approved' ? 'Approved' : 'Rejected'}.`);
      
      // Update local state by removing the actioned review from the current filtered list
      setReviews((prev) => prev.filter((r) => r.id !== id));
      
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      alert(err.message || 'Error executing review moderation.');
    } finally {
      setActioningId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // IF NOT AUTHENTICATED: RENDER LOGIN FORM
  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto glass-premium rounded-3xl p-8 border border-slate-800/80 mt-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Shield size={28} className="animate-pulse-subtle" />
          </div>
          <h3 className="text-xl font-bold text-white">Admin Authentication</h3>
          <p className="text-slate-500 text-xs mt-1">Access the moderation queue dashboard</p>
        </div>

        {loginError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2 animate-fade-in">
            <AlertCircle size={16} />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4.5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                placeholder="Admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="password"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 hover:scale-[1.01] shadow-lg shadow-indigo-500/10 mt-6"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock size={16} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-500 mt-6 font-medium">
          Demo Credentials: <span className="text-indigo-400">admin</span> / <span className="text-indigo-400">admin123</span>
        </p>
      </div>
    );
  }

  // IF AUTHENTICATED: RENDER DASHBOARD
  return (
    <div className="w-full space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/30 rounded-xl p-3 shadow-2xl flex items-center space-x-2 animate-slide-up text-sm font-medium text-slate-200">
          <CheckCircle size={16} className="text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="glass rounded-2xl p-5 flex items-center justify-between border border-slate-800/60">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shadow-inner">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Moderation Dashboard</h3>
            <p className="text-xs text-slate-400">Manage review validation queue</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900/80 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 transition-all focus:outline-none"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>

      {/* Filter Tabs and Refresh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 flex-1 sm:flex-initial">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-none capitalize px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                statusFilter === tab
                  ? tab === 'pending'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                    : tab === 'approved'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                    : 'bg-rose-600 text-white shadow-md shadow-rose-600/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={fetchReviews}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Review Cards Grid */}
      {loading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-medium">Fetching records...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="w-full text-center py-16 p-8 glass rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center">
          <div className="p-3 bg-slate-900/60 rounded-full border border-slate-800 text-slate-500 mb-3">
            <CheckCircle size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-300">No {statusFilter} reviews found</h4>
          <p className="text-slate-500 text-xs mt-1">Queue is empty for this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="glass rounded-2xl p-5 border border-slate-800/60 flex flex-col justify-between hover:border-slate-750 transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between mb-3.5">
                  <div>
                    <h5 className="font-semibold text-slate-100 text-sm leading-tight">{review.reviewerName}</h5>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{review.reviewerEmail}</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-slate-900/60 border border-slate-850 px-2 py-1 rounded-md">
                    <span className="text-xs font-bold text-amber-400">{review.rating}</span>
                    <span className="text-[10px] text-slate-500">/5</span>
                  </div>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed italic bg-slate-950/40 p-3 rounded-xl border border-slate-900 mb-4">
                  "{review.recommendationText}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-850">
                <span className="text-[10px] text-slate-500 font-medium">{formatDate(review.createdAt)}</span>
                
                <div className="flex items-center space-x-2">
                  {statusFilter !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(review.id, 'rejected')}
                      disabled={actioningId === review.id}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-500/20 text-rose-400 hover:text-rose-350 border border-rose-900/30 hover:border-rose-500/30 rounded-lg text-xs font-bold transition-all focus:outline-none disabled:opacity-50"
                    >
                      <X size={12} />
                      <span>Reject</span>
                    </button>
                  )}
                  {statusFilter !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(review.id, 'approved')}
                      disabled={actioningId === review.id}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/30 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-350 border border-emerald-900/30 hover:border-emerald-500/30 rounded-lg text-xs font-bold transition-all focus:outline-none disabled:opacity-50"
                    >
                      <Check size={12} />
                      <span>Approve</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
