import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BsCartFill } from 'react-icons/bs';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://slicecraft-1.onrender.com";

  return (
    <header className="bg-white shadow-sm py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
            S
          </div>
          <span className="text-xl font-bold text-gray-800">
            SliceCraft
          </span>
        </Link>

        <nav className="flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-red-500">
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders" className="text-gray-600 hover:text-red-500">
                <BsCartFill className="w-6 h-6" />
              </Link>
              <Link to="/profile" className="text-gray-600 hover:text-red-500">
                {user?.profilePhoto ? (
                  <img
                    src={`${API_BASE_URL}${user.profilePhoto}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-gray-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </Link>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-red-500"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-red-500">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 