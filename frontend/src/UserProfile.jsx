import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://slicecraft-1.onrender.com";

export default function UserProfile() {
  const { logout, token, updateUserData, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [newProfilePhoto, setNewProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout();
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setName(data.name);
        setEmail(data.email);
        setProfilePhoto(data.profilePhoto ? `${API_BASE_URL}${data.profilePhoto}` : '');
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(`Failed to fetch profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate, logout]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setNewProfilePhoto(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (newProfilePhoto) {
      formData.append('profilePhoto', newProfilePhoto);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setMessage('Profile updated successfully!');
      updateUserData(data.user);
      if (data.user.profilePhoto) {
        setProfilePhoto(`${API_BASE_URL}${data.user.profilePhoto}`);
        setNewProfilePhoto(null);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(`Update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !name && !email) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">User Profile</h1>

          {profilePhoto && (
            <div className="mb-6 flex justify-center">
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-red-500"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="profilePhoto" className="block text-sm font-medium text-gray-700">Profile Photo</label>
              <input
                type="file"
                id="profilePhoto"
                name="profilePhoto"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              <p className="mt-1 text-sm text-gray-500">Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>

            {message && <p className="text-green-600 text-center text-sm mt-4">{message}</p>}
            {error && <p className="text-red-600 text-center text-sm mt-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-red-500 hover:underline">Back to Home</Link>
            <button
              onClick={logout}
              className="ml-4 text-gray-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
} 