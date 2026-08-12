import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Cart from './pages/Cart.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Checkout from './pages/Checkout.jsx';
import MyOrders from './pages/MyOrders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import BecomeSeller from './pages/BecomeSeller.jsx';
import SellerDashboard from './pages/seller/SellerDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import { attachAuthInterceptor } from './api/axios.js';

function App() {
  const { getToken } = useAuth();

  useEffect(() => {
    attachAuthInterceptor(getToken);
  }, [getToken]);

  return (
    <>
      <Navbar />
      <main className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login/*" element={<Login />} />
          <Route path="/register/*" element={<Register />} />
          <Route path="/product/:slug" element={<ProductDetail />} />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/become-seller"
            element={
              <ProtectedRoute>
                <BecomeSeller />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/dashboard"
            element={
              <RoleRoute roles={['seller', 'admin']}>
                <SellerDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute roles={['admin']}>
                <AdminDashboard />
              </RoleRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

export default App;