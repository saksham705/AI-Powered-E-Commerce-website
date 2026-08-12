import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios.js';

const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="status-text">Loading order...</p>;
  if (error) return <p className="status-text error">{error}</p>;
  if (!order) return null;

  return (
    <div className="order-detail">
      <h2>Order #{order._id.slice(-8)}</h2>
      <p className="order-meta">
        Status: <strong>{order.status}</strong>
      </p>
      <p className="order-meta">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>

      <h3>Items</h3>
      {order.orderItems.map((item) => (
        <div className="order-item-row" key={item.product}>
          <img src={item.image} alt={item.name} />
          <span>
            {item.name} × {item.quantity}
          </span>
          <span>{formatINR(item.price * item.quantity)}</span>
        </div>
      ))}

      <h3>Shipping Address</h3>
      <p>
        {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
        {order.shippingAddress.postalCode}, {order.shippingAddress.country}
      </p>

      <div className="order-summary">
        <p>Items: {formatINR(order.itemsPrice)}</p>
        <p>Tax: {formatINR(order.taxPrice)}</p>
        <p>Shipping: {formatINR(order.shippingPrice)}</p>
        <p className="order-total">Total: {formatINR(order.totalPrice)}</p>
      </div>
    </div>
  );
};

export default OrderDetail;