import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import axios from 'axios';
import Header from './components/Header';
import Footer from './components/Footer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://slicecraft-1.onrender.com';

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_BASE_URL}/api/subscribers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setSubscribers(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching subscribers:', err);
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (err.response?.status === 403) {
          setError('You are not authorized to view subscribers.');
        } else {
          setError('Failed to fetch subscribers. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'admin') {
      fetchSubscribers();
    }
  }, [isAuthenticated, user]);

  const handleDelete = async (subscriberId) => {
    if (!window.confirm('Are you sure you want to remove this subscriber?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete(`${API_BASE_URL}/api/subscribers/${subscriberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSubscribers(subscribers.filter(sub => sub._id !== subscriberId));
      setError(null);
    } catch (err) {
      console.error('Error deleting subscriber:', err);
      setError('Failed to delete subscriber. Please try again.');
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-600">You must be an admin to view this page.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Newsletter Subscribers</h1>
                <span className="text-gray-600">{subscribers.length} subscribers</span>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {subscribers.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No subscribers found.</p>
              ) : (
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
                            {new Date(subscriber.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 border-b">
                            <button
                              onClick={() => handleDelete(subscriber._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Subscribers; 