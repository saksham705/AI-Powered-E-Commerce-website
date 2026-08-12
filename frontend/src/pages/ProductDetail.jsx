
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios.js';

const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const ProductDetail = () => {
  const { slug } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    api
      .get(`/products/${slug}`)
      .then((res) => {
        setProduct(res.data);
      })
      .catch(() => {
        setError('Product not found.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  const handleAddToCart = async () => {
    setAdding(true);
    setMessage('');

    try {
      await api.post('/cart', {
        productId: product._id,
        quantity: qty,
      });

      setMessage('Added to cart!');
    } catch (err) {
      if (err.response?.status === 401) {
        setMessage('Please log in to add items to your cart.');
      } else {
        setMessage(
          err.response?.data?.message || 'Could not add to cart.'
        );
      }
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <p className="status-text">Loading product...</p>;
  }

  if (error) {
    return <p className="status-text error">{error}</p>;
  }

  if (!product) {
    return null;
  }

  const hasDiscount =
    product.discountPrice &&
    product.discountPrice < product.price;

  return (
    <div className="product-detail">

      {/* Product Image */}
      <div className="product-detail-image">
        <img
          src={
            product.images?.[0] ||
            'https://placehold.co/500x500?text=AURA'
          }
          alt={product.name}
        />
      </div>

      {/* Product Information */}
      <div className="product-detail-info">

        <span className="product-category">
          {product.category?.name}
        </span>

        <h1>{product.name}</h1>

        {/* Price */}
        <div className="product-price">
          <span className="price-current">
            {formatINR(
              hasDiscount
                ? product.discountPrice
                : product.price
            )}
          </span>

          {hasDiscount && (
            <span className="price-original">
              {formatINR(product.price)}
            </span>
          )}
        </div>

        {/* Rating */}
        {product.ratingsAverage > 0 && (
          <div className="product-rating">
            ★ {product.ratingsAverage.toFixed(1)}

            <span className="rating-count">
              ({product.ratingsCount} reviews)
            </span>
          </div>
        )}

        {/* Description */}
        <p className="product-description">
          {product.description}
        </p>

        {/* ⭐ PROMO VIDEO */}
        {product.promoVideo?.url && (
          <div className="promo-video-section">
            <h3>Product Video</h3>

            <video
              src={product.promoVideo.url}
              controls
              playsInline
              preload="metadata"
              className="promo-video-player"
            >
              Your browser does not support the video player.
            </video>
          </div>
        )}

        {/* Stock */}
        <p className="product-stock">
          {product.stock > 0
            ? `${product.stock} in stock`
            : 'Out of stock'}
        </p>

        {/* Add To Cart */}
        <div className="add-to-cart-row">

          <input
            type="number"
            min="1"
            max={product.stock}
            value={qty}
            onChange={(e) =>
              setQty(Number(e.target.value))
            }
          />

          <button
            onClick={handleAddToCart}
            disabled={
              adding || product.stock === 0
            }
          >
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>

        </div>

        {/* Cart Message */}
        {message && (
          <p className="cart-message">
            {message}
          </p>
        )}

      </div>
    </div>
  );
};

export default ProductDetail;

