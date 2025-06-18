import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import axios from 'axios';
import Header from './components/Header';
import Footer from './components/Footer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PaymentPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [orderSummary, setOrderSummary] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  const [error, setError] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transferScreenshot, setTransferScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const response = await axios.get(`${API_BASE_URL}/api/orders/cart`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data) {
          setOrderSummary(response.data.items || []);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          // No active cart found, redirect to menu
          setError('No active cart found. Please add items to your cart first.');
          setTimeout(() => navigate('/menu'), 2000);
        } else {
          setError('Failed to fetch cart. Please try again.');
          console.error('Error fetching cart:', err);
        }
      }
    };

    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, navigate]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    return orderSummary.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG, etc.)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      setTransferScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);
    setPaymentProcessing(true);

    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.postalCode || !deliveryAddress.country) {
      setError('Please fill in all delivery address details.');
      setPaymentProcessing(false);
      return;
    }

    if (!transferScreenshot) {
      setError('Please upload a screenshot of your bank transfer.');
      setPaymentProcessing(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      // Create FormData to send both order details and file
      const formData = new FormData();
      formData.append('deliveryAddress', JSON.stringify({
        street: deliveryAddress.street.trim(),
        city: deliveryAddress.city.trim(),
        state: deliveryAddress.state.trim(),
        zipCode: deliveryAddress.postalCode.trim(),
        country: deliveryAddress.country.trim(),
      }));
      formData.append('transferScreenshot', transferScreenshot);

      const response = await axios.put(`${API_BASE_URL}/api/orders/place-order`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        setPaymentSuccess(true);
        navigate('/orders');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
            <p className="mb-4">You need to be logged in to access the payment page.</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
          </div>
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
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Payment</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Section - Order Summary */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                {orderSummary.map((item) => (
                  <div key={item._id} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Delivery Address & Payment */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={deliveryAddress.street}
                      onChange={handleAddressChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={deliveryAddress.city}
                      onChange={handleAddressChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State / Province</label>
                    <input
                      type="text"
                      name="state"
                      value={deliveryAddress.state}
                      onChange={handleAddressChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={deliveryAddress.postalCode}
                      onChange={handleAddressChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={deliveryAddress.country}
                      onChange={handleAddressChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <p className="text-gray-700 mb-2">Bank Transfer Details:</p>
                    <p className="font-medium">Account Number: 1000307200647</p>
                    <p className="font-medium">Bank: Commercial Bank of Ethiopia</p>
                  </div>

                  {/* Transfer Screenshot Upload */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Transfer Screenshot
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        {screenshotPreview ? (
                          <div className="mb-4">
                            <img
                              src={screenshotPreview}
                              alt="Transfer Screenshot Preview"
                              className="mx-auto h-32 w-auto object-contain"
                            />
                            <button
                              onClick={() => {
                                setTransferScreenshot(null);
                                setScreenshotPreview(null);
                              }}
                              className="mt-2 text-sm text-red-600 hover:text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <>
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleFileChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={paymentProcessing}
                  className={`mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors ${
                    paymentProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {paymentProcessing ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentPage;