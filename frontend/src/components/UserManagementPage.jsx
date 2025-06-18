import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { API_BASE_URL } from '../../config'; // This import is causing the error

const API_BASE_URL = 'http://localhost:5000'; // Define API_BASE_URL directly here

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(null); // Stores the ID of the user being edited
  const [editedUserName, setEditedUserName] = useState('');
  const [editedUserEmail, setEditedUserEmail] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user'); // Default role

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        };
        const response = await axios.get(`${API_BASE_URL}/api/auth/users`, config);
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Error fetching users.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setEditMode(user._id);
    setEditedUserName(user.name);
    setEditedUserEmail(user.email);
  };

  const handleSave = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      await axios.put(`${API_BASE_URL}/api/auth/users/${userId}`, { name: editedUserName, email: editedUserEmail }, config);
      setEditMode(null);
      const response = await axios.get(`${API_BASE_URL}/api/auth/users`, config);
      setUsers(response.data);
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Error saving user.');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(null);
    setEditedUserName('');
    setEditedUserEmail('');
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        };
        await axios.delete(`${API_BASE_URL}/api/auth/users/${userId}`, config);
        setUsers(users.filter(user => user._id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Error deleting user.');
      }
    }
  };

  const handleUpgradeToAdmin = async (userId) => {
    if (window.confirm('Are you sure you want to upgrade this user to Admin?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };
        const response = await axios.put(`${API_BASE_URL}/api/auth/users/${userId}/role`, { role: 'admin' }, config);
        setUsers(users.map(user => user._id === userId ? { ...user, role: response.data.user.role } : user));
      } catch (err) {
        console.error('Error upgrading user to admin:', err);
        setError('Error upgrading user to admin.');
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      await axios.post(`${API_BASE_URL}/api/auth/register`, { 
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      }, config);
      setShowAddUserForm(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      const response = await axios.get(`${API_BASE_URL}/api/auth/users`, config);
      setUsers(response.data);
    } catch (err) {
      console.error('Error adding new user:', err);
      setError('Error adding new user.');
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading Users...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">User Management</h2>
      <p className="text-gray-600 mb-6">Manage all registered users, update their roles, and delete accounts.</p>

      <button
        onClick={() => setShowAddUserForm(!showAddUserForm)}
        className="bg-green-500 text-white px-4 py-2 rounded-md text-sm mb-4"
      >
        {showAddUserForm ? 'Cancel Add User' : 'Add New User'}
      </button>

      {showAddUserForm && (
        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
          <h3 className="text-xl font-semibold mb-4">Add New User</h3>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newUserName" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="newUserName"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="newUserEmail"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="newUserPassword"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="newUserRole" className="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="newUserRole"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add User
              </button>
              <button
                type="button"
                onClick={() => setShowAddUserForm(false)}
                className="ml-3 bg-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left text-gray-600">ID</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Name</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Email</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Role</th>
              <th className="py-2 px-4 border-b text-left text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="py-2 px-4 border-b">{user._id.substring(0, 7)}</td>
                <td className="py-2 px-4 border-b">
                  {editMode === user._id ? (
                    <input
                      type="text"
                      value={editedUserName}
                      onChange={(e) => setEditedUserName(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    user.name
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {editMode === user._id ? (
                    <input
                      type="email"
                      value={editedUserEmail}
                      onChange={(e) => setEditedUserEmail(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td className="py-2 px-4 border-b">{user.role}</td>
                <td className="py-2 px-4 border-b">
                  {editMode === user._id ? (
                    <>
                      <button
                        onClick={() => handleSave(user._id)}
                        className="bg-green-500 text-white px-3 py-1 rounded-md text-sm mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-400 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(user)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm mr-2"
                      >
                        <i className="fas fa-edit mr-1"></i>Edit
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleUpgradeToAdmin(user._id)}
                          className="bg-purple-500 text-white px-3 py-1 rounded-md text-sm mr-2"
                        >
                          <i className="fas fa-user-shield mr-1"></i>Make Admin
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                      >
                        <i className="fas fa-trash-alt mr-1"></i>Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage; 