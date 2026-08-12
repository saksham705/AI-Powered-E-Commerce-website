import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import api from '../api/axios.js';
import { useCurrentUser } from '../context/UserContext.jsx';

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const navigate = useNavigate();
  const { profile } = useCurrentUser();

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(keyword ? `/?keyword=${encodeURIComponent(keyword)}` : '/');
  };

  return (
    <header className="navbar">
      <div className="navbar-top">
        <Link to="/" className="brand">
          AURA
        </Link>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="navbar-actions">
          <SignedIn>
            <Link to="/wishlist" className="nav-link">
              Wishlist
            </Link>
            <Link to="/cart" className="nav-link">
              Cart
            </Link>
            <Link to="/orders" className="nav-link">
              Orders
            </Link>

            {profile?.role === 'customer' && (
              <Link to="/become-seller" className="nav-link">
                Sell on AURA
              </Link>
            )}
            {profile?.role === 'seller' && (
              <Link to="/seller/dashboard" className="nav-link">
                Seller Dashboard
              </Link>
            )}
            {profile?.role === 'admin' && (
              <Link to="/admin/dashboard" className="nav-link">
                Admin Panel
              </Link>
            )}

            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <Link to="/cart" className="nav-link">
              Cart
            </Link>
            <Link to="/login" className="nav-link">
              Login
            </Link>
          </SignedOut>
        </div>
      </div>

      <nav className="navbar-categories">
        <button className="category-toggle" onClick={() => setShowCategories((s) => !s)}>
          Categories ▾
        </button>

        {showCategories && (
          <div className="category-dropdown">
            {categories.length === 0 && <span className="category-empty">No categories yet</span>}
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/?category=${cat.slug || cat._id}`}
                className="category-item"
                onClick={() => setShowCategories(false)}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;