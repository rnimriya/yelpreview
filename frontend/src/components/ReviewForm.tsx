import React, { useState } from 'react';
import { Star, Send, User, Mail, MessageSquare, CheckCircle } from 'lucide-react';

interface ReviewFormProps {
  backendUrl: string;
  onReviewSubmitted?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ backendUrl, onReviewSubmitted }) => {
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [recommendationText, setRecommendationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 6000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!reviewerName.trim() || !reviewerEmail.trim() || !recommendationText.trim()) {
      setError('All fields are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${backendUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewerName,
          reviewerEmail,
          rating,
          recommendationText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Success
      triggerToast('Thank you! Your review has been submitted and is pending moderation.');
      
      // Reset form
      setReviewerName('');
      setReviewerEmail('');
      setRating(0);
      setRecommendationText('');
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto glass-premium rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-slate-800">
      {/* Decorative gradient blur background */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-1">
        Share Your Experience
      </h3>
      <p className="text-slate-400 text-sm mb-6">
        Your feedback helps us grow. Submitted reviews will be processed by moderation.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star Rating Select */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Rating</label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-all duration-200 focus:outline-none hover:scale-110"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  size={32}
                  className={`transition-colors duration-200 ${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                      : 'text-slate-600 fill-transparent'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-xs font-semibold text-slate-400 ml-2 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800">
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Fair' : 'Poor'}
              </span>
            )}
          </div>
        </div>

        {/* Reviewer Name */}
        <div>
          <label htmlFor="reviewerName" className="block text-sm font-semibold text-slate-300 mb-1.5">
            Your Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="reviewerName"
              type="text"
              required
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
              placeholder="e.g. Jane Doe"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
            />
          </div>
        </div>

        {/* Reviewer Email */}
        <div>
          <label htmlFor="reviewerEmail" className="block text-sm font-semibold text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="reviewerEmail"
              type="email"
              required
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
              placeholder="e.g. jane@example.com"
              value={reviewerEmail}
              onChange={(e) => setReviewerEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Recommendation Text */}
        <div>
          <label htmlFor="recommendationText" className="block text-sm font-semibold text-slate-300 mb-1.5">
            Your Review
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3.5 top-4.5 text-slate-500" size={18} />
            <textarea
              id="recommendationText"
              required
              rows={4}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
              placeholder="Tell us what you liked, or how we can improve..."
              value={recommendationText}
              onChange={(e) => setRecommendationText(e.target.value)}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Submit Review</span>
              <Send size={16} />
            </>
          )}
        </button>
      </form>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-2xl flex items-start space-x-3.5 animate-slide-up">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Review Submitted</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{toastMessage}</p>
          </div>
          <button 
            onClick={() => setShowToast(false)} 
            className="text-slate-500 hover:text-slate-300 text-xs font-semibold focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
