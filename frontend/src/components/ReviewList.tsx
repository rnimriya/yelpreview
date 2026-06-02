import React, { useState, useEffect } from 'react';
import { Star, LayoutGrid, Sliders, ChevronLeft, ChevronRight, MessageSquareOff } from 'lucide-react';

interface Review {
  id: string;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  recommendationText: string;
  createdAt: string;
}

interface ReviewListProps {
  backendUrl: string;
  refreshTrigger?: number; // External count to re-fetch
}

export const ReviewList: React.FC<ReviewListProps> = ({ backendUrl, refreshTrigger }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  
  // Carousel index state
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchApprovedReviews = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/reviews/approved`);
      if (!response.ok) {
        throw new Error('Failed to load reviews.');
      }
      const data = await response.json();
      setReviews(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to the reviews server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedReviews();
  }, [backendUrl, refreshTrigger]);

  // Statistics calculation
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  const renderStars = (ratingValue: number, size = 16) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= ratingValue
                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]'
                : 'text-slate-700 fill-transparent'
            }`}
          />
        ))}
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Carousel controls
  const nextSlide = () => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevSlide = () => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  if (loading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading approved reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-12 p-6 glass rounded-2xl border border-rose-500/10">
        <p className="text-rose-400 text-sm mb-4">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchApprovedReviews();
          }}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-indigo-400 hover:bg-slate-800 transition-colors"
        >
          Try Reconnecting
        </button>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="w-full text-center py-16 p-8 glass rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center">
        <div className="p-4 bg-slate-900/50 rounded-full border border-slate-800 text-slate-500 mb-4">
          <MessageSquareOff size={32} />
        </div>
        <h4 className="text-lg font-bold text-slate-300">No Reviews Yet</h4>
        <p className="text-slate-500 text-sm mt-1 max-w-sm">
          Be the first to recommend this business by filling out the review form above!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Reviews Summary Stats Header */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between border border-slate-800/60 gap-6">
        <div className="flex items-center space-x-6">
          <div className="text-center md:text-left">
            <h4 className="text-4xl font-extrabold text-white tracking-tight">{averageRating}</h4>
            <div className="mt-1.5">{renderStars(Math.round(parseFloat(averageRating)), 20)}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Based on {totalReviews} approved {totalReviews === 1 ? 'recommendation' : 'recommendations'}
            </p>
          </div>
          
          <div className="hidden sm:block h-12 w-px bg-slate-800" />

          <div className="hidden sm:flex flex-col space-y-1">
            {[5, 4, 3, 2, 1].map((ratingVal) => {
              const count = reviews.filter((r) => r.rating === ratingVal).length;
              const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={ratingVal} className="flex items-center text-xs text-slate-400 space-x-2">
                  <span className="w-3 text-right">{ratingVal}</span>
                  <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-slate-500 w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* View Layout Controls */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-800/80 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Grid View</span>
          </button>
          <button
            onClick={() => setViewMode('carousel')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'carousel'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={14} />
            <span>Carousel</span>
          </button>
        </div>
      </div>

      {/* RENDER MODES */}
      {viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="glass rounded-2xl p-6 border border-slate-800/60 hover:border-slate-700/60 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center font-bold text-sm text-indigo-400">
                      {getInitials(review.reviewerName)}
                    </div>
                    <div>
                      <h5 className="font-semibold text-slate-200 text-sm leading-tight">{review.reviewerName}</h5>
                      <span className="text-[10px] text-slate-500">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="mb-3.5">{renderStars(review.rating)}</div>
                <p className="text-slate-300 text-sm leading-relaxed italic">
                  "{review.recommendationText}"
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* CAROUSEL VIEW */
        <div className="relative glass rounded-3xl p-8 border border-slate-800/60 max-w-2xl mx-auto flex flex-col justify-between h-[300px] animate-fade-in overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Carousel Slide */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center font-bold text-base text-indigo-400 shadow-inner">
                  {getInitials(reviews[currentIndex].reviewerName)}
                </div>
                <div>
                  <h5 className="font-bold text-slate-200 text-base">{reviews[currentIndex].reviewerName}</h5>
                  <span className="text-xs text-slate-500">{formatDate(reviews[currentIndex].createdAt)}</span>
                </div>
              </div>
              <div>{renderStars(reviews[currentIndex].rating, 18)}</div>
            </div>
            
            <div className="relative min-h-[100px] flex items-center">
              <p className="text-slate-300 text-base leading-relaxed italic pl-4 border-l-2 border-indigo-500/40">
                "{reviews[currentIndex].recommendationText}"
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 mt-4">
            <span className="text-xs text-slate-500 font-semibold">
              {currentIndex + 1} of {reviews.length}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevSlide}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
