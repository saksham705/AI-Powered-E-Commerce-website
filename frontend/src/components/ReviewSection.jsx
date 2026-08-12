import { useEffect, useState } from 'react';
import api from '../api/axios.js';

const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);

  const loadReviews = () => {
    api
      .get(`/reviews/product/${productId}`)
      .then((res) => setReviews(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
    setAiLoading(true);
    api
      .get(`/ai/review-summary/${productId}`)
      .then((res) => setAiSummary(res.data))
      .catch(() => setAiSummary(null))
      .finally(() => setAiLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/reviews/product/${productId}`, { rating, comment });
      setComment('');
      setRating(5);
      loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-section">
      {!aiLoading && aiSummary && (
        <div className="ai-summary-box">
          <span className="ai-badge">AI Summary</span>
          <p>{aiSummary.summary}</p>
          <div className="ai-summary-columns">
            <div>
              <strong>Pros</strong>
              <ul>
                {(aiSummary.pros || []).map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Cons</strong>
              <ul>
                {(aiSummary.cons || []).map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
          <span className="ai-sentiment">
            Sentiment: {aiSummary.sentiment} ({aiSummary.sentimentScore})
          </span>
        </div>
      )}

      <h3>Reviews</h3>

      {loading ? (
        <p className="status-text">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="status-text">No reviews yet. Be the first to review this product.</p>
      ) : (
        <div className="review-list">
          {reviews.map((r) => (
            <div className="review-item" key={r._id}>
              <div className="review-header">
                <strong>{r.user?.name || 'Anonymous'}</strong>
                <span className="review-stars">
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </span>
              </div>
              <p>{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="review-form">
        <h4>Write a review</h4>
        <p className="form-hint">You can only review products you've purchased.</p>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? 's' : ''}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Share your experience with this product..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          required
        />
        {error && <p className="status-text error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewSection;