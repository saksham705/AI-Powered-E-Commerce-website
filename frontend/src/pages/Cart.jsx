import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const Cart = () => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  const loadCart = () => {
    api
      .get('/cart')
      .then((res) => setCart(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQty = async (productId, quantity) => {
    await api.put(`/cart/${productId}`, { quantity });
    loadCart();
  };

  const removeItem = async (productId) => {
    await api.delete(`/cart/${productId}`);
    loadCart();
  };

  if (loading) return <p className="status-text">Loading cart...</p>;
  if (!cart.items || cart.items.length === 0)
    return <p className="status-text">Your cart is empty.</p>;

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart-page">
      {cart.items.map((item) => (
        <div className="cart-item" key={item.product._id}>
          <img src={item.product.images?.[0]} alt={item.product.name} />
          <div className="cart-item-info">
            <h4>{item.product.name}</h4>
            <span>{formatINR(item.price)}</span>
          </div>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => updateQty(item.product._id, Number(e.target.value))}
          />
          <button onClick={() => removeItem(item.product._id)}>Remove</button>
        </div>
      ))}
      <div className="cart-total">Total: {formatINR(total)}</div>
      <Link to="/checkout" className="checkout-btn">
        Proceed to Checkout
      </Link>
    </div>
  );
};

export default Cart;