import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import InventoryManagementPage from './InventoryManagementPage';
import OrderManagementPage from './OrderManagementPage';
import UserManagementPage from './UserManagementPage';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://slicecraft-1.onrender.com';

const AdminDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('adminDashboard');
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found, please log in.');
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        };

        // Fetch inventory
        const inventoryRes = await axios.get(`${API_BASE_URL}/api/inventory`, config);
        setInventory(inventoryRes.data);

        // Fetch orders
        const ordersRes = await axios.get(`${API_BASE_URL}/api/orders/admin`, config);
        setOrders(ordersRes.data);

        // Fetch subscribers
        try {
          const subscribersRes = await axios.get(`${API_BASE_URL}/api/subscribe`, config);
          setSubscribers(subscribersRes.data);
        } catch (subErr) {
          console.error('Error fetching subscribers:', subErr);
          // Don't set error state for subscribers, just log it
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Error fetching admin data.');
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus }, config);
      setOrders(orders.map(order => order._id === orderId ? { ...order, status: newStatus } : order));
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Error updating order status.');
    }
  };

  // Handle email subscription
  const handleSubscribe = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!subscribeEmail) {
      alert("Please enter your email address to subscribe.");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/subscribe`, { email: subscribeEmail });

      if (response.status === 200) {
        alert("Thank you for subscribing!");
        setSubscribeEmail(''); // Clear email input
        // Refresh the subscribers list
        const subscribersRes = await axios.get('/api/subscribe', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setSubscribers(subscribersRes.data);
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        alert("This email is already subscribed to our newsletter!");
      } else {
        console.error("Subscription error:", err);
        alert("Subscription failed. Please try again.");
      }
    }
  };

  const handleDeleteSubscriber = async (subscriberId) => {
    if (!window.confirm('Are you sure you want to remove this subscriber?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };
      await axios.delete(`${API_BASE_URL}/api/subscribe/${subscriberId}`, config);
      setSubscribers(subscribers.filter(sub => sub._id !== subscriberId));
      alert('Subscriber removed successfully.');
    } catch (err) {
      console.error('Error removing subscriber:', err);
      setError('Error removing subscriber. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  }

  if (user && user.role !== 'admin') {
    return <div className="text-center py-10">Access Denied: You must be an administrator to view this page.</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-red-600">SliceCraft</h1>
        </div>
        <nav className="mt-4">
          <ul>
            <li>
              <a href="#" onClick={() => setActiveTab('adminDashboard')} className={`flex items-center px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-600 ${activeTab === 'adminDashboard' ? 'bg-red-100 text-red-600' : ''}`}>
                <i className="fas fa-tachometer-alt mr-3"></i>
                Admin Dashboard
              </a>
            </li>
            <li>
              <a href="#" onClick={() => setActiveTab('inventoryManagement')} className={`flex items-center px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-600 ${activeTab === 'inventoryManagement' ? 'bg-red-100 text-red-600' : ''}`}>
                <i className="fas fa-boxes mr-3"></i>
                Inventory Management
              </a>
            </li>
            <li>
              <a href="#" onClick={() => setActiveTab('orderManagement')} className={`flex items-center px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-600 ${activeTab === 'orderManagement' ? 'bg-red-100 text-red-600' : ''}`}>
                <i className="fas fa-clipboard-list mr-3"></i>
                Order Management
              </a>
            </li>
            <li>
              <a href="#" onClick={() => setActiveTab('lowStockAlerts')} className={`flex items-center px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-600 ${activeTab === 'lowStockAlerts' ? 'bg-red-100 text-red-600' : ''}`}>
                <i className="fas fa-exclamation-triangle mr-3"></i>
                Low Stock Alerts
              </a>
            </li>
            <li>
              <a href="#" onClick={() => setActiveTab('userManagement')} className={`flex items-center px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-600 ${activeTab === 'userManagement' ? 'bg-red-100 text-red-600' : ''}`}>
                <i className="fas fa-users-cog mr-3"></i>
                User Management
              </a>
            </li>
            <li>
              <a href="#" onClick={() => setActiveTab('subscribers')} className={`flex items-center px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-600 ${activeTab === 'subscribers' ? 'bg-red-100 text-red-600' : ''}`}>
                <i className="fas fa-envelope mr-3"></i>
                Subscribers
              </a>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
          <div className="flex items-center">
            <img src={user && user.profilePhoto ? `${API_BASE_URL}${user.profilePhoto}` : "https://via.placeholder.com/40"} alt="Admin User" className="w-10 h-10 rounded-full mr-3 object-cover" />
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-gray-800 truncate">{user ? user.name : 'Admin User'}</p>
              <p className="text-sm text-gray-500 truncate">{user ? user.email : 'admin@pizzabuilder.com'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="flex justify-between items-center p-4 bg-white shadow-md">
          <div className="text-xl font-semibold text-gray-800">Admin Dashboard</div>
          <div className="flex items-center">
            <Link to="/" className="mr-4 text-gray-700 hover:text-red-600">Home</Link>
            <Link to="/profile" className="mr-4 text-gray-700 hover:text-red-600">My Account</Link>
            <Link to="/payment" className="mr-4 text-gray-700 hover:text-red-600"><i className="fas fa-credit-card"></i></Link>
            <div className="relative mr-4">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-gray-700 hover:text-red-600 focus:outline-none">
                <i className="fas fa-bell text-lg"></i>
                {inventory.filter(item => item.quantity <= item.threshold).length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform -translate-y-1/2">
                    {inventory.filter(item => item.quantity <= item.threshold).length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-20">
                  <div className="block px-4 py-2 text-xs text-gray-400">Low Stock Alerts</div>
                  {inventory.filter(item => item.quantity <= item.threshold).length > 0 ? (
                    inventory.filter(item => item.quantity <= item.threshold).map((item) => (
                      <div key={item._id} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <p className="font-semibold">{item.name} is low!</p>
                        <p className="text-xs text-gray-500">Current: {item.quantity} {item.unit}, Threshold: {item.threshold} {item.unit}</p>
                      </div>
                    ))
                  ) : (
                    <div className="block px-4 py-2 text-sm text-gray-700">No low stock alerts.</div>
                  )}
                </div>
              )}
            </div>
            <Link to={"/profile"}><img src={user && user.profilePhoto ? `${API_BASE_URL}${user.profilePhoto}` : "https://via.placeholder.com/32"} alt="User Profile" className="w-8 h-8 rounded-full object-cover" /></Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 bg-gray-100">
          {activeTab === 'subscribers' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Email Subscribers</h2>
              <div className="mb-6">
                <p className="text-gray-600">Total Subscribers: {subscribers.length}</p>
                <form onSubmit={handleSubscribe} className="mt-4 flex items-center space-x-2">
                  <input
                    type="email"
                    placeholder="Enter email to subscribe (e.g., john.doe@example.com)"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-3 px-4 border-b text-left text-gray-600">Email</th>
                      <th className="py-3 px-4 border-b text-left text-gray-600">Subscribed Date</th>
                      <th className="py-3 px-4 border-b text-left text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b">{subscriber.email}</td>
                        <td className="py-3 px-4 border-b">
                          {new Date(subscriber.subscribedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 border-b">
                          <button
                            onClick={() => handleDeleteSubscriber(subscriber._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'lowStockAlerts' && (
            <>
              {/* Critical Stock Alert */}
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg" role="alert">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle mr-3"></i>
                  <p className="font-bold">Critical Stock Alert!</p>
                </div>
                <p className="mt-1">You have {inventory.filter(item => item.quantity <= item.threshold).length} items below their safety stock threshold. Please review and reorder immediately.</p>
              </div>

              {/* Low Stock Summary */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-bold text-gray-800">Low Stock Summary</h2>
                <p className="text-gray-600">Overview of ingredients needing attention.</p>
                <p className="text-5xl font-bold text-red-600 mt-4">{inventory.filter(item => item.quantity <= item.threshold).length}</p>
                <p className="text-gray-500">items currently low</p>
              </div>

              {/* Detailed Low Stock Items */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Detailed Low Stock Items</h2>
                <p className="text-gray-600 mb-4">A complete list of all ingredients with stock levels below their set thresholds.</p>
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b text-left text-gray-600">ID</th>
                      <th className="py-2 px-4 border-b text-left text-gray-600">Item Name</th>
                      <th className="py-2 px-4 border-b text-left text-gray-600">Current Stock</th>
                      <th className="py-2 px-4 border-b text-left text-gray-600">Threshold</th>
                      <th className="py-2 px-4 border-b text-left text-gray-600">Unit</th>
                      <th className="py-2 px-4 border-b text-left text-gray-600">Last Restocked</th>
                      <th className="py-2 px-4 border-b text-left text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.filter(item => item.quantity <= item.threshold).map((item) => (
                      <tr key={item._id}>
                        <td className="py-2 px-4 border-b">{item._id.substring(0, 7)}</td>
                        <td className="py-2 px-4 border-b">{item.name} ({item.itemType})</td>
                        <td className="py-2 px-4 border-b"><span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-sm">{item.quantity}</span></td>
                        <td className="py-2 px-4 border-b">{item.threshold}</td>
                        <td className="py-2 px-4 border-b">{item.unit}</td>
                        <td className="py-2 px-4 border-b">{new Date(item.lastRestocked).toLocaleDateString()}</td>
                        <td className="py-2 px-4 border-b">
                          <button className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm mr-2"><i className="fas fa-shopping-cart mr-1"></i>Reorder</button>
                          <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm"><i className="fas fa-edit mr-1"></i>Adjust</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'inventoryManagement' && (
            <InventoryManagementPage inventory={inventory} setInventory={setInventory} />
          )}

          {activeTab === 'orderManagement' && (
            <OrderManagementPage orders={orders} setOrders={setOrders} />
          )}

          {activeTab === 'userManagement' && (
            <UserManagementPage />
          )}

          {activeTab === 'adminDashboard' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800">Welcome to Admin Dashboard</h2>
              <p className="mt-2 text-gray-600">Select an option from the sidebar to manage your store.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;