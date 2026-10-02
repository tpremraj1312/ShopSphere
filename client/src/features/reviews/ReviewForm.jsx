import React, { useState } from 'react';
import { useCreateReviewMutation } from '../../store/reviewApi';

/**
 * ReviewForm — Gated review submission (REV-FR-01, Step 3.2.6)
 * Only rendered when the user has a delivered order containing this product.
 * Props:
 *   productId - the product being reviewed
 *   orderId   - the delivered order ID
 *   onSuccess - callback after successful submission
 */
export default function ReviewForm({ productId, orderId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);

  const [createReview, { isLoading }] = useCreateReviewMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!body.trim()) {
      setError('Please write a review');
      return;
    }

    try {
      await createReview({
        productId,
        orderId,
        rating,
        title,
        body,
        photos: []
      }).unwrap();

      setRating(0);
      setTitle('');
      setBody('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err?.data?.error?.message || 'Failed to submit review');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-white tracking-tight mb-4">Write a Review</h3>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="text-[11px] uppercase font-mono tracking-widest text-slate-400 mb-2 block">Your Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`text-2xl transition-colors duration-150 ${
                star <= (hoverRating || rating)
                  ? 'text-amber-400'
                  : 'text-slate-600 hover:text-slate-500'
              }`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`Rate ${star} stars`}
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <span className="text-xs text-slate-400 ml-2 self-center">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="text-[11px] uppercase font-mono tracking-widest text-slate-400 mb-1.5 block">
          Review Title <span className="text-slate-600">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={200}
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
        />
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="text-[11px] uppercase font-mono tracking-widest text-slate-400 mb-1.5 block">Your Review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts about this product..."
          rows={4}
          maxLength={5000}
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all resize-none"
        />
        <p className="text-[10px] text-slate-600 mt-1 text-right">{body.length}/5000</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/20"
      >
        {isLoading ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
