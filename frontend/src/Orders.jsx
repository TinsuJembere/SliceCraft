import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { BsCartFill } from 'react-icons/bs';
import axios from 'axios';
import { format } from 'date-fns';
import Header from './components/Header';
import Footer from './components/Footer';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [subscribeEmail, setSubscribeEmail] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://slicecraft-1.onrender.com";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!isAuthenticated || !user) {
          console.log('User not authenticated, redirecting to login...');
          navigate('/login');
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login...');
          navigate('/login');
          return;
        }

        const userId = user._id || user.id;
        if (!userId) {
          console.error('No user ID found in user object:', user);
          setError('User ID not found. Please try logging in again.');
          return;
        }

        console.log('Fetching orders for user:', userId);
        const response = await fetch(`${API_BASE_URL}/api/orders/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 403) {
            console.error('Access forbidden - user not authorized');
            setError('You are not authorized to view these orders');
          } else if (response.status === 401) {
            console.error('Unauthorized - token may be invalid');
            logout();
            navigate('/login');
            return;
          } else {
            console.error('Failed to fetch orders:', response.status);
            setError('Failed to fetch orders. Please try again later.');
          }
          return;
        }

        const data = await response.json();
        console.log('Orders fetched successfully:', data);
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          console.error('Invalid response format:', data);
          setError('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate, user, isAuthenticated, logout]);

  const handleEdit = (orderId) => {
    navigate(`/customize-pizza?orderId=${orderId}`);
  };

  const handleCancel = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to cancel order");
        }

        setOrders(orders.filter((order) => order._id !== orderId));
      } catch (err) {
        console.error("Error canceling order:", err);
        setError("Failed to cancel order");
      }
    }
  };

  const handleViewStatus = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscribeEmail) {
      alert("Please enter your email address to subscribe.");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/subscribe`, { email: subscribeEmail });

      if (response.status === 200) {
        alert("Thank you for subscribing!");
        setSubscribeEmail(''); // Clear email input
      } else {
        alert("Subscription failed. Please try again.");
      }
    } catch (err) {
      console.error("Subscription error:", err);
      alert("Subscription failed. Please try again.");
    }
  };

  if (orderId) {
    const order = orders[0];
    if (!order && !loading) {
      return (
        <>
          <Header />
          <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4">
              <div className="text-center text-xl text-gray-600">
                Order not found.
              </div>
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
          <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4">
              <div className="text-center">Loading order details...</div>
            </div>
          </div>
          <Footer />
        </>
      );
    }
    if (error) {
      return (
        <>
          <Header />
          <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4">
              <div className="text-center text-red-600">Error: {error}</div>
            </div>
          </div>
          <Footer />
        </>
      );
    }

    const statusSteps = ["Order Received", "In the Kitchen", "Sent for Delivery", "completed"];
    const currentStatusIndex = statusSteps.indexOf(order.status);

    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-100 py-8">
          <div className="container mx-auto px-4">
            <Link
              to="/orders"
              className="inline-flex items-center text-gray-600 hover:text-red-500 font-semibold mb-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
              Back to All Orders
            </Link>

            <main className="container mx-auto py-12 px-4">
              <h1 className="text-4xl font-bold text-gray-800 mb-10 text-center">
                Your Order Status
              </h1>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Order Status
                  </h2>
                  <div className="flex justify-between items-center relative">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 ${
                          currentStatusIndex >= 0 ? "bg-red-500" : "bg-gray-300"
                        }`}
                      >
                        <i className="fas fa-clipboard-check"></i>
                      </div>
                      <p
                        className={`font-semibold ${
                          currentStatusIndex >= 0 ? "text-red-600" : "text-gray-600"
                        }`}
                      >
                        Order Received
                      </p>
                      <p className="text-sm text-gray-500 text-center mt-1">
                        Your order has been successfully placed and confirmed.
                      </p>
                    </div>

                    <div
                      className={`flex-1 h-1 ${
                        currentStatusIndex >= 1 ? "bg-red-500" : "bg-gray-300"
                      }`}
                    ></div>

                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 ${
                          currentStatusIndex >= 1 ? "bg-red-500" : "bg-gray-300"
                        }`}
                      >
                        <i className="fas fa-utensils"></i>
                      </div>
                      <p
                        className={`font-semibold ${
                          currentStatusIndex >= 1 ? "text-red-600" : "text-gray-600"
                        }`}
                      >
                        In Kitchen
                      </p>
                      <p className="text-sm text-gray-500 text-center mt-1">
                        Our chefs are busy preparing your delicious pizza.
                      </p>
                    </div>

                    <div
                      className={`flex-1 h-1 ${
                        currentStatusIndex >= 2 ? "bg-red-500" : "bg-gray-300"
                      }`}
                    ></div>

                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2 ${
                          currentStatusIndex >= 2 ? "bg-red-500" : "bg-gray-300"
                        }`}
                      >
                        <i className="fas fa-motorcycle"></i>
                      </div>
                      <p
                        className={`font-semibold ${
                          currentStatusIndex >= 2 ? "text-red-600" : "text-gray-600"
                        }`}
                      >
                        Out for Delivery
                      </p>
                      <p className="text-sm text-gray-500 text-center mt-1">
                        Your pizza is on its way and will arrive shortly!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      Order Details
                    </h2>
                    <div className="space-y-3 text-gray-700">
                      <p className="flex justify-between">
                        <span>Order ID:</span>{" "}
                        <span className="font-semibold">
                          #{order._id.substring(0, 10).toUpperCase()}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Estimated Delivery:</span>{" "}
                        <span className="font-semibold">30-45 mins</span>
                      </p>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">
                      Items Ordered
                    </h3>
                    <ul className="space-y-4">
                      {order.items.map((item, index) => (
                        <li key={index} className="flex items-center space-x-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-700">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.qty} | ${item.price?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                          <span className="font-semibold text-gray-800">
                            ${(item.price * item.qty)?.toFixed(2) || "0.00"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      Order Summary
                    </h2>
                    <div className="space-y-3 text-gray-700">
                      <p className="flex justify-between">
                        <span>Subtotal:</span>{" "}
                        <span>${order.totalAmount.toFixed(2)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Delivery Fee:</span> <span>$3.50</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Total:</span>{" "}
                        <span className="font-bold text-xl text-red-600">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="font-semibold text-gray-700 mb-2">
                        Payment Method:
                      </p>
                      <p className="text-gray-600">CBE mobile banking</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="font-semibold text-gray-700 mb-2">
                        Delivery Address:
                      </p>
                      <p className="text-gray-600">
                        {order.deliveryAddress
                          ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.postalCode}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Please log in to view your orders</h2>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Login
              </button>
            </div>
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
        <div className="min-h-screen bg-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">Loading orders...</div>
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
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Orders</h1>
          
          {loading ? (
            <div className="text-center">Loading orders...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : orders.length === 0 ? (
            <div className="text-center text-gray-600">
              <p className="text-xl mb-4">No orders found</p>
              <Link to="/" className="text-red-500 hover:text-red-600">
                Start ordering now!
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Order #{order._id.slice(-6)}
                      </h2>
                      <p className="text-gray-600">
                        {format(new Date(order.createdAt), 'PPP')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} x ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <p className="font-semibold">Total Amount</p>
                      <p className="font-bold text-lg">${order.totalAmount.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleViewStatus(order._id)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View Status
                      </button>
                      {order.status === 'Order Received' && (
                        <>
                          <button
                            onClick={() => handleEdit(order._id)}
                            className="px-4 py-2 text-sm font-medium text-yellow-600 hover:text-yellow-800"
                          >
                            Edit Order
                          </button>
                          <button
                            onClick={() => handleCancel(order._id)}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Cancel Order
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Orders;
