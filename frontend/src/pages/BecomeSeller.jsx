import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useCurrentUser } from '../context/UserContext.jsx';

const BecomeSeller = () => {
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { profile, refetch } = useCurrentUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.put('/auth/become-seller', { storeName, storeDescription });
      await refetch();
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (profile?.role === 'seller') {
    return (
      <p className="status-text">
        You're already registered as a seller
        {profile.isApproved ? '.' : ' — your account is pending admin approval.'}
      </p>
    );
  }

  return (
    <div className="form-page">
      <h2>Become a Seller</h2>
      <p className="form-hint">
        Fill in your store details. An admin will review and approve your account before you can
        list products.
      </p>
      <form onSubmit={handleSubmit} className="simple-form">
        <label>
          Store name
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
        </label>
        <label>
          Store description
          <textarea
            value={storeDescription}
            onChange={(e) => setStoreDescription(e.target.value)}
            rows={4}
          />
        </label>
        {error && <p className="status-text error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default BecomeSeller;