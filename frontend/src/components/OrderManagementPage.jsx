import React from 'react';
import axios from 'axios';

const OrderManagementPage = ({ orders, setOrders }) => {
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
      // setError('Error updating order status.'); // You might want to add local error state
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Order Management</h2>
      <p className="text-gray-600 mb-4">Manage customer orders and update their status.</p>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left text-gray-600">Order ID</th>
            <th className="py-2 px-4 border-b text-left text-gray-600">Customer</th>
            <th className="py-2 px-4 border-b text-left text-gray-600">Total Amount</th>
            <th className="py-2 px-4 border-b text-left text-gray-600">Status</th>
            <th className="py-2 px-4 border-b text-left text-gray-600">Order Date</th>
            <th className="py-2 px-4 border-b text-left text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td className="py-2 px-4 border-b">{order._id.substring(0, 7)}</td>
              <td className="py-2 px-4 border-b">{order.user ? order.user.name : 'N/A'}</td>
              <td className="py-2 px-4 border-b">${order.totalAmount.toFixed(2)}</td>
              <td className="py-2 px-4 border-b">{order.status}</td>
              <td className="py-2 px-4 border-b">{new Date(order.createdAt).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="Order Received">Order Received</option>
                  <option value="In the Kitchen">In the Kitchen</option>
                  <option value="Sent for Delivery">Sent for Delivery</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderManagementPage; 