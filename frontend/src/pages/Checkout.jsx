import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

const Checkout = () => {
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();

  const handlePay = async (e) => {
    e.preventDefault();

    setError('');
    setProcessing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setError(
          'Could not load payment gateway. Check your internet connection.'
        );
        setProcessing(false);
        return;
      }

      const { data } = await api.post('/payments/create-order');

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'AURA',
        description: 'Order Payment',
        order_id: data.order_id,

        handler: async (response) => {
          try {
            const verifyRes = await api.post(
              '/payments/verify-payment',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );

            if (!verifyRes.data.success) {
              setError(
                'Payment verification failed. Please contact support.'
              );
              setProcessing(false);
              return;
            }

            const orderRes = await api.post('/orders', {
              shippingAddress: address,
              paymentMethod: 'razorpay',
              paymentResult: {
                id: response.razorpay_payment_id,
                status: 'paid',
                update_time: new Date().toISOString(),
              },
            });

            if (!orderRes.data?._id) {
              throw new Error('Order was not created.');
            }

            navigate(`/orders/${orderRes.data._id}`);
          } catch (err) {
            console.error('Order creation error:', err);

            setError(
              err.response?.data?.message ||
                'Payment succeeded, but order could not be created.'
            );

            setProcessing(false);
          }
        },

        modal: {
          ondismiss: () => {
            setError('Payment cancelled.');
            setProcessing(false);
          },
        },

        theme: {
          color: '#12213a',
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        console.error('Payment failed:', response);

        setError(
          `Payment failed: ${
            response.error?.description || 'Unknown error'
          }`
        );

        setProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);

      setError(
        err.response?.data?.message ||
          'Could not start checkout. Is your cart empty?'
      );

      setProcessing(false);
    }
  };

  return (
    <div className="form-page">
      <h2>Shipping Address</h2>

      <form onSubmit={handlePay} className="simple-form">
        <label>
          Street
          <input
            value={address.street}
            onChange={(e) =>
              setAddress({
                ...address,
                street: e.target.value,
              })
            }
            required
          />
        </label>

        <label>
          City
          <input
            value={address.city}
            onChange={(e) =>
              setAddress({
                ...address,
                city: e.target.value,
              })
            }
            required
          />
        </label>

        <label>
          State
          <input
            value={address.state}
            onChange={(e) =>
              setAddress({
                ...address,
                state: e.target.value,
              })
            }
            required
          />
        </label>

        <label>
          Postal Code
          <input
            value={address.postalCode}
            onChange={(e) =>
              setAddress({
                ...address,
                postalCode: e.target.value,
              })
            }
            required
          />
        </label>

        <label>
          Country
          <input
            value={address.country}
            onChange={(e) =>
              setAddress({
                ...address,
                country: e.target.value,
              })
            }
            required
          />
        </label>

        {error && (
          <p className="status-text error">
            {error}
          </p>
        )}

        <button type="submit" disabled={processing}>
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
    </div>
  );
};

export default Checkout;