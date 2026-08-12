import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import ProductCard from '../components/ProductCard.jsx';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/wishlist')
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status-text">Loading wishlist...</p>;
  if (items.length === 0) return <p className="status-text">Your wishlist is empty.</p>;

  return (
    <div className="product-grid">
      {items.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default Wishlist;