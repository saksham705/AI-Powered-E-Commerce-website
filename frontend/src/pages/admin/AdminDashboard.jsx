import { useEffect, useState } from 'react';
import api from '../../api/axios.js';

const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  // Load dashboard data
  const loadAll = async () => {
    try {
      const statsRes = await api.get('/admin/dashboard');
      setStats(statsRes.data);

      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data);
    } catch (error) {
      console.error(
        'Failed to load admin dashboard:',
        error.response?.data?.message || error.message
      );
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Approve seller
  const approveSeller = async (id) => {
    try {
      await api.put(`/admin/users/${id}/approve`);

      // Refresh users after approval
      loadAll();
    } catch (error) {
      console.error(
        'Failed to approve seller:',
        error.response?.data?.message || error.message
      );
    }
  };

  // Ban / Unban user
  const toggleBan = async (id) => {
    try {
      await api.put(`/admin/users/${id}/ban`);

      // Refresh users after ban/unban
      loadAll();
    } catch (error) {
      console.error(
        'Failed to update user:',
        error.response?.data?.message || error.message
      );
    }
  };

  return (
    <div className="dashboard">

      <h2>Admin Dashboard</h2>

      {/* ================= TABS ================= */}

      <div className="dashboard-tabs">

        <button
          className={tab === 'overview' ? 'active' : ''}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>

        <button
          className={tab === 'users' ? 'active' : ''}
          onClick={() => setTab('users')}
        >
          Users
        </button>

      </div>


      {/* ================= OVERVIEW ================= */}

      {tab === 'overview' && stats && (
        <div className="stats-grid">

          <div className="stat-card">
            <span>{stats.totalUsers}</span>
            Users
          </div>

          <div className="stat-card">
            <span>{stats.totalSellers}</span>
            Sellers
          </div>

          <div className="stat-card">
            <span>{stats.totalCustomers}</span>
            Customers
          </div>

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

        </div>
      )}


      {/* ================= USERS ================= */}

      {tab === 'users' && (
        <div className="admin-table">

          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users.map((u) => (

              <div className="admin-row" key={u._id}>

                {/* User information */}
                <span className="flex-grow">
                  {u.name}
                  <small> ({u.email})</small>
                </span>


                {/* Role */}
                <span className="badge">
                  {u.role}
                </span>


               

                {u.role === 'seller' && !u.isApproved && (
                  <button
                    onClick={() => approveSeller(u._id)}
                  >
                    Approve Seller
                  </button>
                )}


                {/* Approved seller status */}
                {u.role === 'seller' && u.isApproved && (
                  <span className="badge">
                    Approved
                  </span>
                )}


         

                {u.role !== 'admin' && (
                  <button
                    className={u.isBanned ? '' : 'danger'}
                    onClick={() => toggleBan(u._id)}
                  >
                    {u.isBanned ? 'Unban' : 'Ban'}
                  </button>
                )}

              </div>

            ))
          )}

        </div>
      )}

    </div>
  );
};

export default AdminDashboard;