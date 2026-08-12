import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios.js';
import ProductCard from '../components/ProductCard.jsx';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageInfo, setPageInfo] = useState({ page: 1, totalPages: 1, total: 0 });

  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const { isSignedIn } = useAuth();

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);

  useEffect(() => {
    setLoading(true);
    setError('');

    // ⚠️ Yeh conversion hi missing thi — backend ko 'price[gte]'/'price[lte]' format chahiye
    const params = { page, limit: 12 };
    if (keyword) params.keyword = keyword;
    if (category) params.category = category;
    if (minPrice) params['price[gte]'] = minPrice;
    if (maxPrice) params['price[lte]'] = maxPrice;

    api
      .get('/products', { params })
      .then((res) => {
        setProducts(res.data.products || []);
        setPageInfo({
          page: res.data.page,
          totalPages: res.data.totalPages,
          total: res.data.total,
        });
      })
      .catch(() => setError('Could not load products. Please try again.'))
      .finally(() => setLoading(false));
  }, [keyword, category, page, minPrice, maxPrice]);

  useEffect(() => {
    if (!isSignedIn || keyword || category) return;
    setRecLoading(true);
    api
      .get('/ai/recommendations')
      .then((res) => setRecommendations(res.data || []))
      .catch(() => setRecommendations([]))
      .finally(() => setRecLoading(false));
  }, [isSignedIn, keyword, category]);

  const goToPage = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyPriceFilter = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (minInput) next.set('minPrice', minInput);
    else next.delete('minPrice');
    if (maxInput) next.set('maxPrice', maxInput);
    else next.delete('maxPrice');
    next.set('page', 1);
    setSearchParams(next);
  };

  const clearPriceFilter = () => {
    setMinInput('');
    setMaxInput('');
    const next = new URLSearchParams(searchParams);
    next.delete('minPrice');
    next.delete('maxPrice');
    next.set('page', 1);
    setSearchParams(next);
  };

  return (
    <>
      {isSignedIn && !keyword && !category && (
        <section className="recommendations-section">
          <h2>Recommended for you</h2>
          {recLoading ? (
            <p className="status-text">Loading recommendations...</p>
          ) : recommendations.length === 0 ? (
            <p className="status-text">No recommendations yet.</p>
          ) : (
            <div className="product-grid">
              {recommendations.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="price-filter-row">
        <form onSubmit={applyPriceFilter} className="price-filter-form">
          <span>Price:</span>
          <input
            type="number"
            placeholder="Min ₹"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
          />
          <button type="submit">Apply</button>
          {(minPrice || maxPrice) && (
            <button type="button" className="clear-btn" onClick={clearPriceFilter}>
              Clear
            </button>
          )}
        </form>
      </div>

      <h2 className="section-title">
        All Products {pageInfo.total > 0 && `(${pageInfo.total})`}
      </h2>

      {loading && <p className="status-text">Loading products...</p>}
      {error && <p className="status-text error">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="status-text">No products found.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {pageInfo.totalPages > 1 && (
            <div className="pagination">
              <button disabled={pageInfo.page <= 1} onClick={() => goToPage(pageInfo.page - 1)}>
                ← Prev
              </button>
              <span className="pagination-info">
                Page {pageInfo.page} of {pageInfo.totalPages}
              </span>
              <button
                disabled={pageInfo.page >= pageInfo.totalPages}
                onClick={() => goToPage(pageInfo.page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Home;