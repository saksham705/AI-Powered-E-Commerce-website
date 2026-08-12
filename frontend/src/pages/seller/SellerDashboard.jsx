import { useEffect, useState } from 'react';
import api from '../../api/axios.js';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  category: '',
  stock: '',
  brand: '',
  images: [],
};

const SellerDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // AI Content Studio States
  const [aiPanel, setAiPanel] = useState(null);
  const [aiLoadingId, setAiLoadingId] = useState(null);

  // Promo Video States
  const [videoPanel, setVideoPanel] = useState(null);
  const [videoLoadingId, setVideoLoadingId] = useState(null);

  // Reviews States
  const [productReviews, setProductReviews] = useState({});
  const [expandedProductId, setExpandedProductId] = useState(null);

  const loadAll = () => {
    api
      .get('/seller/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => {});

    api
      .get('/products/seller/my-products')
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));

    api
      .get('/orders/seller/my-sales')
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]));

    api
      .get('/categories')
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (tab !== 'insights') return;

    setInsightsLoading(true);

    api
      .get('/ai/sales-insights')
      .then((res) => setInsights(res.data))
      .catch(() => setInsights(null))
      .finally(() => setInsightsLoading(false));
  }, [tab]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      images: [],
    });

    setEditingId(null);
    setError('');
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append('images', file);
      });

      const res = await api.post('/products/upload-images', formData);

      const uploadedFiles = res.data.files || [];

      const uploadedUrls = uploadedFiles
        .map((file) => {
          if (typeof file === 'string') {
            return file;
          }

          return file.path || file.secure_url || file.url;
        })
        .filter(Boolean);

      if (uploadedUrls.length === 0) {
        throw new Error('No image URL received from server.');
      }

      setForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }));
    } catch (err) {
      console.error('Image upload error:', err);

      setError(
        err.response?.data?.message || err.message || 'Image upload failed.'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (url) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((img) => img !== url),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.images || form.images.length === 0) {
      setError('Please upload at least one product image.');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      discountPrice: form.discountPrice
        ? Number(form.discountPrice)
        : undefined,
      category: form.category,
      stock: Number(form.stock),
      brand: form.brand,
      images: form.images,
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      resetForm();
      loadAll();
      setTab('products');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not save product.'
      );
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price || '',
      discountPrice: p.discountPrice || '',
      category: p.category?._id || '',
      stock: p.stock || '',
      brand: p.brand || '',
      images: Array.isArray(p.images) ? p.images : [],
    });

    setEditingId(p._id);
    setError('');
    setTab('add');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      loadAll();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not delete product.'
      );
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      loadAll();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not update order status.'
      );
    }
  };

  // AI Content Studio Handler
  const runContentStudio = async (productId) => {
    setAiLoadingId(productId);

    try {
      const res = await api.post(`/ai/content-studio/${productId}`);

      setAiPanel({
        productId,
        data: res.data,
      });
    } catch (err) {
      alert(
        err.response?.data?.message || 'AI Content Studio failed.'
      );
    } finally {
      setAiLoadingId(null);
    }
  };

  // Promo Video Generator Handler
  const generatePromoVideo = async (product) => {
    setVideoLoadingId(product._id);

    try {
      const res = await api.post(`/ai/generate-video/${product._id}`);

      setVideoPanel({
        productId: product._id,
        videoUrl: res.data.videoUrl,
      });

      loadAll();
    } catch (err) {
      alert(
        err.response?.data?.message || 'Promo video generation failed.'
      );
    } finally {
      setVideoLoadingId(null);
    }
  };

  // Reviews Toggle Handler
  const toggleReviews = async (productId) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      return;
    }
    setExpandedProductId(productId);

    if (!productReviews[productId]) {
      try {
        const res = await api.get(`/reviews/product/${productId}`);
        setProductReviews((prev) => ({ ...prev, [productId]: res.data }));
      } catch (err) {
        setProductReviews((prev) => ({ ...prev, [productId]: [] }));
      }
    }
  };

  const applyAiSuggestion = () => {
    if (!aiPanel) return;

    const p = products.find((x) => x._id === aiPanel.productId);

    if (!p) return;

    handleEdit(p);

    setForm((prev) => ({
      ...prev,
      name: aiPanel.data.title || prev.name,
      description: aiPanel.data.description || prev.description,
    }));

    setAiPanel(null);
  };

  return (
    <div className="dashboard">
      <h2>Seller Dashboard</h2>

      <div className="dashboard-tabs">
        <button
          className={tab === 'overview' ? 'active' : ''}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>

        <button
          className={tab === 'products' ? 'active' : ''}
          onClick={() => setTab('products')}
        >
          My Products
        </button>

        <button
          className={tab === 'add' ? 'active' : ''}
          onClick={() => {
            resetForm();
            setTab('add');
          }}
        >
          {editingId ? 'Edit Product' : 'Add Product'}
        </button>

        <button
          className={tab === 'orders' ? 'active' : ''}
          onClick={() => setTab('orders')}
        >
          Orders
        </button>

        <button
          className={tab === 'insights' ? 'active' : ''}
          onClick={() => setTab('insights')}
        >
          AI Insights
        </button>
      </div>

      {tab === 'overview' && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span>{stats.totalProducts}</span>
            Products
          </div>

          <div className="stat-card">
            <span>{stats.totalOrders}</span>
            Orders
          </div>

          <div className="stat-card">
            <span>₹{stats.totalRevenue}</span>
            Revenue
          </div>

          <div className="stat-card">
            <span>{stats.totalUnitsSold}</span>
            Units Sold
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="admin-table">
          {products.map((p) => (
            <div key={p._id}>
              <div className="admin-row">
                <img src={p.images?.[0]} alt={p.name} />
                <span className="flex-grow">{p.name}</span>
                <span>₹{p.price}</span>
                <span>Stock: {p.stock}</span>

                <button
                  onClick={() => runContentStudio(p._id)}
                  disabled={aiLoadingId === p._id}
                >
                  {aiLoadingId === p._id ? 'Generating...' : 'AI Content Studio'}
                </button>

                <button
                  onClick={() => generatePromoVideo(p)}
                  disabled={videoLoadingId === p._id}
                >
                  {videoLoadingId === p._id
                    ? 'Generating Video...'
                    : 'Generate Promo Video'}
                </button>

                <button onClick={() => toggleReviews(p._id)}>
                  {expandedProductId === p._id ? 'Hide Reviews' : 'Reviews'}
                </button>

                <button onClick={() => handleEdit(p)}>Edit</button>

                <button className="danger" onClick={() => handleDelete(p._id)}>
                  Delete
                </button>
              </div>

              {expandedProductId === p._id && (
                <div className="seller-reviews-panel">
                  {!productReviews[p._id] ? (
                    <p className="status-text">Loading reviews...</p>
                  ) : productReviews[p._id].length === 0 ? (
                    <p className="status-text">
                      No reviews yet for this product.
                    </p>
                  ) : (
                    productReviews[p._id].map((r) => (
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
                    ))
                  )}
                </div>
              )}
            </div>
          ))}

          {aiPanel && (
            <div className="ai-panel">
              <h4>AI Suggestion</h4>
              <p>
                <strong>Title:</strong> {aiPanel.data.title}
              </p>
              <p>
                <strong>Description:</strong> {aiPanel.data.description}
              </p>
              <p>
                <strong>Tags:</strong> {(aiPanel.data.tags || []).join(', ')}
              </p>
              <p>
                <strong>Target Audience:</strong> {aiPanel.data.targetAudience}
              </p>
              <p>
                <strong>Pricing Advice:</strong> {aiPanel.data.pricingAdvice}
              </p>
              <div className="ai-panel-actions">
                <button onClick={applyAiSuggestion}>
                  Use This — Edit Product
                </button>
                <button onClick={() => setAiPanel(null)}>Dismiss</button>
              </div>
            </div>
          )}

          {videoPanel && (
            <div className="ai-panel">
              <h4>Promo Video</h4>
              <video
                src={videoPanel.videoUrl}
                controls
                playsInline
                style={{
                  width: '100%',
                  maxWidth: '720px',
                  borderRadius: '8px',
                  display: 'block',
                }}
              />
              <div className="ai-panel-actions">
                <a
                  href={videoPanel.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Video
                </a>
                <button onClick={() => setVideoPanel(null)}>Dismiss</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'add' && (
        <form onSubmit={handleSubmit} className="simple-form">
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              rows={3}
              required
            />
          </label>

          <label>
            Price (₹)
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Discount Price (₹, optional)
            <input
              type="number"
              value={form.discountPrice}
              onChange={(e) =>
                setForm({
                  ...form,
                  discountPrice: e.target.value,
                })
              }
            />
          </label>

          <label>
            Category
            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Stock
            <input
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Brand
            <input
              value={form.brand}
              onChange={(e) =>
                setForm({
                  ...form,
                  brand: e.target.value,
                })
              }
            />
          </label>

          <label>
            Product Images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
          </label>

          {form.images && form.images.length > 0 && (
            <div className="image-preview-row">
              {form.images.map((url) => (
                <div className="image-preview" key={url}>
                  <img src={url} alt="Product preview" />
                  <button type="button" onClick={() => removeImage(url)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="status-text error">{error}</p>}

          <button type="submit" disabled={uploading}>
            {editingId ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      )}

      {tab === 'orders' && (
        <div className="admin-table">
          {orders.map((o) => (
            <div className="admin-row" key={o._id}>
              <span className="flex-grow">
                Order #{o._id.slice(-8)}
              </span>

              <span>₹{o.totalPrice}</span>

              <select
                value={o.status}
                onChange={(e) => updateOrderStatus(o._id, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === 'insights' && (
        <div className="insights-box">
          {insightsLoading ? (
            <p className="status-text">Loading insights...</p>
          ) : insights ? (
            <>
              <p className="ai-badge">AI Insights</p>

              <p>{insights.summary}</p>

              <p>
                <strong>Trend:</strong> {insights.trend}
              </p>

              <h4>Top Performers</h4>

              <ul>
                {(insights.topPerformers || []).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>

              <h4>Recommendations</h4>

              <ul>
                {(insights.recommendations || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="status-text">No insights available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;