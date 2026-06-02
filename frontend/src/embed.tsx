import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReviewForm } from './components/ReviewForm';
import { ReviewList } from './components/ReviewList';
import './index.css';

interface WidgetContainerProps {
  backendUrl: string;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ backendUrl }) => {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="trustguard-embed bg-slate-950 text-slate-100 p-6 rounded-3xl border border-slate-900 max-w-7xl mx-auto space-y-10 selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5">
          <ReviewForm backendUrl={backendUrl} onReviewSubmitted={handleRefresh} />
        </div>
        <div className="lg:col-span-7 space-y-5">
          <h4 className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Verified Customer Reviews</span>
          </h4>
          <ReviewList backendUrl={backendUrl} refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
};

// Auto-initialize when the script is loaded
const initWidget = () => {
  const container = document.getElementById('trustguard-widget');
  if (container) {
    const backendUrl = container.getAttribute('data-backend-url') || 'http://localhost:5001';
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <WidgetContainer backendUrl={backendUrl} />
      </React.StrictMode>
    );
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}
