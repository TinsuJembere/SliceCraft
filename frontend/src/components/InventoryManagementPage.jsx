import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Define API_BASE_URL

const InventoryManagementPage = ({ inventory, setInventory }) => {
  const [editItem, setEditItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false); // New state for add form visibility
  const [newItem, setNewItem] = useState({
    itemType: '',
    name: '',
    quantity: '',
    threshold: '',
    unit: '',
    price: '',
  });

  const handleEditClick = (item) => {
    setEditItem(item);
    setNewQuantity(item.quantity);
    setNewThreshold(item.threshold);
    setError(null);
    setSuccess(null);
    setShowAddForm(false); // Hide add form when editing
  };

  const handleSave = async () => {
    if (!editItem) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      // Validate input
      if (!newQuantity || !newThreshold) {
        setError('Please fill in all required fields');
        return;
      }

      const quantity = parseInt(newQuantity);
      const threshold = parseInt(newThreshold);

      if (isNaN(quantity) || isNaN(threshold)) {
        setError('Please enter valid numbers for quantity and threshold');
        return;
      }

      if (quantity < 0 || threshold < 0) {
        setError('Quantity and threshold must be positive numbers');
        return;
      }

      const updatedData = {
        quantity,
        threshold,
      };

      console.log('Updating inventory item:', editItem._id, updatedData);
      const res = await axios.put(`${API_BASE_URL}/api/inventory/${editItem._id}`, updatedData, config);
      
      if (res.data) {
        setInventory(inventory.map(item => 
          item._id === editItem._id ? res.data : item
        ));
        setSuccess('Inventory updated successfully!');
        setEditItem(null);
        setNewQuantity('');
        setNewThreshold('');
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.error('Error updating inventory:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You are not authorized to update inventory.');
      } else {
        setError(err.response?.data?.message || 'Failed to update inventory. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setEditItem(null);
    setError(null);
    setSuccess(null);
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json',
        },
      };

      const res = await axios.post(`${API_BASE_URL}/api/inventory`, newItem, config);
      setInventory([...inventory, res.data]);
      setSuccess('Inventory item added successfully!');
      setShowAddForm(false);
      setNewItem({ itemType: '', name: '', quantity: '', threshold: '', unit: '', price: '' }); // Reset form
    } catch (err) {
      console.error('Error adding inventory item:', err);
      setError(err.response?.data?.message || 'Failed to add inventory item.');
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token,
          },
        };
        await axios.delete(`${API_BASE_URL}/api/inventory/${itemId}`, config);
        setInventory(inventory.filter(item => item._id !== itemId));
        setSuccess('Inventory item deleted successfully!');
      } catch (err) {
        console.error('Error deleting inventory item:', err);
        setError(err.response?.data?.message || 'Failed to delete inventory item.');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Inventory Management</h2>
      <p className="text-gray-600 mb-4">Manage your stock of pizza ingredients.</p>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      <button 
        onClick={() => { setShowAddForm(!showAddForm); setEditItem(null); setError(null); setSuccess(null); }}
        className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4 hover:bg-blue-600 transition"
      >
        {showAddForm ? 'Cancel Add' : 'Add New Inventory Item'}
      </button>

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="space-y-4 mb-6 p-4 border border-gray-200 rounded-md">
          <h3 className="text-lg font-semibold text-gray-800">Add New Item</h3>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Item Type:</label>
            <select
              name="itemType"
              value={newItem.itemType}
              onChange={handleAddChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select Type</option>
              <option value="base">Base</option>
              <option value="sauce">Sauce</option>
              <option value="cheese">Cheese</option>
              <option value="veggie">Veggie</option>
              <option value="meat">Meat</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
            <input
              type="text"
              name="name"
              value={newItem.name}
              onChange={handleAddChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Item Name"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Price:</label>
            <input
              type="number"
              name="price"
              value={newItem.price}
              onChange={handleAddChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Price"
              required
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Quantity:</label>
            <input
              type="number"
              name="quantity"
              value={newItem.quantity}
              onChange={handleAddChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Quantity"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Threshold:</label>
            <input
              type="number"
              name="threshold"
              value={newItem.threshold}
              onChange={handleAddChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Threshold"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Unit:</label>
            <input
              type="text"
              name="unit"
              value={newItem.unit}
              onChange={handleAddChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., units, lbs, gallons"
              required
            />
          </div>
          <button 
            type="submit" 
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
          >
            Add Item
          </button>
        </form>
      )}

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
          {inventory.map((item) => (
            <tr key={item._id}>
              <td className="py-2 px-4 border-b">{item._id.substring(0, 7)}</td>
              <td className="py-2 px-4 border-b">{item.name} ({item.itemType})</td>
              <td className="py-2 px-4 border-b">
                {editItem?._id === item._id ? (
                  <input 
                    type="number" 
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-20 px-2 py-1 border rounded"
                  />
                ) : (
                  <span className={`${item.quantity <= item.threshold ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-700'} px-2 py-1 rounded-full text-sm`}>
                    {item.quantity}
                  </span>
                )}
              </td>
              <td className="py-2 px-4 border-b">
                {editItem?._id === item._id ? (
                  <input 
                    type="number" 
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    className="w-20 px-2 py-1 border rounded"
                  />
                ) : (
                  <span>{item.threshold}</span>
                )}
              </td>
              <td className="py-2 px-4 border-b">{item.unit}</td>
              <td className="py-2 px-4 border-b">{new Date(item.lastRestocked).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b">
                {editItem?._id === item._id ? (
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm"><i className="fas fa-save mr-1"></i>Save</button>
                    <button onClick={handleCancel} className="bg-gray-400 text-white px-3 py-1 rounded-md text-sm"><i className="fas fa-times mr-1"></i>Cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(item)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm"><i className="fas fa-edit mr-1"></i>Adjust</button>
                    <button onClick={() => handleDelete(item._id)} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"><i className="fas fa-trash mr-1"></i>Delete</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryManagementPage; 