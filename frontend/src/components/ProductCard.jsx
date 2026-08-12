import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

const formatINR = (amount) =>
new Intl.NumberFormat('en-IN', {
style: 'currency',
currency: 'INR',
maximumFractionDigits: 0,
}).format(amount || 0);

const ProductCard = ({ product }) => {
const [isWishlisted, setIsWishlisted] = useState(false);
const [wishlistLoading, setWishlistLoading] = useState(false);

const hasDiscount =
product.discountPrice &&
product.discountPrice < product.price;

useEffect(() => {
const checkWishlist = async () => {
try {
const res = await api.get('/wishlist');


    const wishlist = res.data || [];

    const exists = wishlist.some(
      (item) => item._id === product._id
    );

    setIsWishlisted(exists);
  } catch (err) {
    if (err.response?.status !== 401) {
      console.error('Wishlist check error:', err);
    }
  }
};

checkWishlist();


}, [product._id]);

const handleWishlist = async (e) => {
e.preventDefault();
e.stopPropagation();


if (wishlistLoading) return;

setWishlistLoading(true);

try {
  if (isWishlisted) {
    await api.delete(`/wishlist/${product._id}`);
    setIsWishlisted(false);
  } else {
    await api.post(`/wishlist/${product._id}`);
    setIsWishlisted(true);
  }
} catch (err) {
  console.error('Wishlist error:', err);

  if (err.response?.status === 401) {
    alert('Please login to use wishlist.');
  } else if (err.response?.status === 400) {
    setIsWishlisted(true);
  } else {
    alert(
      err.response?.data?.message ||
        'Could not update wishlist.'
    );
  }
} finally {
  setWishlistLoading(false);
}


};

return (
<Link
to={`/product/${product.slug}`}
className="product-card"
> <div className="product-image">
<img
src={
product.images?.[0] ||
'https://placehold.co/400x400?text=AURA'
}
alt={product.name}
loading="lazy"
/>


    <button
      type="button"
      className={`wishlist-button ${
        isWishlisted ? 'wishlisted' : ''
      }`}
      onClick={handleWishlist}
      disabled={wishlistLoading}
      aria-label={
        isWishlisted
          ? 'Remove from wishlist'
          : 'Add to wishlist'
      }
    >
      {isWishlisted ? '♥' : '♡'}
    </button>
  </div>

  <div className="product-info">
    <span className="product-category">
      {product.category?.name}
    </span>

    <h3 className="product-name">
      {product.name}
    </h3>

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

    {product.ratingsAverage > 0 && (
      <div className="product-rating">
        ★ {product.ratingsAverage.toFixed(1)}
        <span className="rating-count">
          ({product.ratingsCount})
        </span>
      </div>
    )}
  </div>
</Link>


);
};

export default ProductCard;
