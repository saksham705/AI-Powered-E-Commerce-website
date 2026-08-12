import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const statusColors = {
  pending: '#e8a33d',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#d64545',
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data || []);
      } catch (err) {
        console.error('My orders error:', err);

        setError(
          err.response?.data?.message ||
            'Could not load your orders.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) {
    return (
      <p className="status-text">
        Loading orders...
      </p>
    );
  }

  if (error) {
    return (
      <p className="status-text error">
        {error}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="status-text">
        <h2>My Orders</h2>
        <p>You haven't placed any orders yet.</p>
        <Link to="/">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h2>My Orders</h2>

      <div className="orders-list">
        {orders.map((order) => (
          <Link
            to={`/orders/${order._id}`}
            key={order._id}
            className="order-row"
          >
            <div>
              <strong>
                Order #{order._id.slice(-8)}
              </strong>

              <p>
                {new Date(
                  order.createdAt
                ).toLocaleDateString('en-IN')}
              </p>

              <p>
                {order.orderItems?.length || 0} item(s)
              </p>
            </div>

            <span
              className="order-status"
              style={{
                background:
                  statusColors[order.status] || '#999',
              }}
            >
              {order.status}
            </span>

            <strong>
              {formatINR(order.totalPrice)}
            </strong>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;