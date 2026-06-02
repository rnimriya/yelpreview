import { useState } from 'react';
import { ReviewForm } from './components/ReviewForm';
import { ReviewList } from './components/ReviewList';
import { AdminDashboard } from './components/AdminDashboard';
import { MessageSquare, Shield, HelpCircle, Building } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'public' | 'admin'>('public');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Configuration - during local development backend runs on port 5001, in production it routes to /_/backend via Vercel's multi-service routing
  const BACKEND_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001' : '/_/backend');

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic glow effect in background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Global Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/35">
              <Building size={18} className="text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-wide uppercase">TrustGuard</span>
              <span className="text-[10px] text-indigo-400 font-bold block leading-none">Review Widget System</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-850">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === 'public'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={14} />
              <span>Public Showcase</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield size={14} />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === 'public' ? (
          /* PUBLIC SHOWCASE VIEW */
          <div className="space-y-12 animate-fade-in">
            {/* Header info */}
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                Business Recommendations
              </h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                This is the embeddable customer interface. Users can submit reviews on the left, 
                and verified, moderator-approved reviews will instantly display in the dashboard catalog on the right.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form */}
              <div className="lg:col-span-5">
                <ReviewForm backendUrl={BACKEND_URL} onReviewSubmitted={handleRefresh} />
              </div>

              {/* Right Column: Carousel/List */}
              <div className="lg:col-span-7 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Approved Customer Reviews</span>
                </h3>
                <ReviewList backendUrl={BACKEND_URL} refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </div>
        ) : (
          /* ADMIN PORTAL VIEW */
          <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Review Moderation Queue
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Approve or Reject reviews here. When you approve a review, it will immediately propagate to the active showcase display.
              </p>
            </div>

            <AdminDashboard backendUrl={BACKEND_URL} onStatusChange={handleRefresh} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center justify-center space-x-2">
            <HelpCircle size={14} className="text-slate-600" />
            <span>Standalone Widget Integration Blueprint.</span>
          </div>
          <p className="mt-2 sm:mt-0">
            &copy; {new Date().getFullYear()} TrustGuard Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
