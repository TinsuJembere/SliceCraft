import React, { useState, useEffect } from 'react';
import PizzaCard from './components/PizzaCard';
import { useAuth } from './context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BsCartFill } from "react-icons/bs"; // Import the cart icon
import axios from 'axios'; // Import axios

const PIZZA_API_URL = `${import.meta.env.VITE_API_URL}/api/pizzas`;
const API_BASE_URL = import.meta.env.VITE_API_URL; // Define API_BASE_URL

export default function Home() {
  const [allPizzas, setAllPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user, logout } = useAuth(); // Destructure user from useAuth
  const navigate = useNavigate(); // Initialize useNavigate
  const [subscribeEmail, setSubscribeEmail] = useState(''); // State for subscribe email

  useEffect(() => {
    const fetchPizzas = async () => {
      try {
        const response = await fetch(PIZZA_API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllPizzas(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPizzas();
  }, []);

  // Function to handle direct order now
  const handleOrderNow = async (pizza) => {
    if (!isAuthenticated) {
      alert("Please log in to place an order.");
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const item = {
        image: pizza.image, // Add the image property
        name: pizza.name,
        description: pizza.description,
        price: pizza.price || 0,
        quantity: 1, // Use 'quantity' instead of 'qty'
        // Include specific pizza components if available
        base: pizza.base || undefined,
        sauce: pizza.sauce || undefined,
        cheese: pizza.cheese || undefined,
        veggies: pizza.veggies || undefined,
        meats: pizza.meats || undefined,
        customizations: [
          pizza.base,
          pizza.sauce,
          pizza.cheese,
          ...(pizza.veggies || []),
          ...(pizza.meats || []),
        ].filter(Boolean),
      };

      const response = await axios.post(`${API_BASE_URL}/api/orders/add-to-cart`, item, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status !== 200) {
        throw new Error(response.data.message || `HTTP error! status: ${response.status}`);
      }

      console.log("Item added to cart:", response.data);
      navigate('/payment'); // Navigate to payment page

    } catch (err) {
      console.error("Error ordering pizza directly:", err);
      alert("Failed to order pizza. Please try again. " + err.message);
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

  // Simple categorization based on names (can be refined if backend adds a 'category' field)
  const getPizzaDescription = (pizza) => {
    let description = [];
    if (pizza.base) description.push(pizza.base);
    if (pizza.sauce) description.push(pizza.sauce);
    if (pizza.cheese) description.push(pizza.cheese);
    if (pizza.veggies && pizza.veggies.length > 0) description.push(...pizza.veggies);
    return description.join(', ') + '.';
  };

  const classicPizzas = allPizzas.filter(pizza => 
    [ 'Classic Pepperoni', 'Margherita Masterpiece', 'Four Cheese Delight', 'Mushroom Mania'].includes(pizza.name)
  ).map(pizza => ({
    ...pizza,
    description: getPizzaDescription(pizza),
  }));

  const gourmetPizzas = allPizzas.filter(pizza => 
    [ 'Truffle Chicken Alfredo', 'Prosciutto & Arugula', 'Spicy Chorizo Fiesta', 'Mediterranean Veggie'].includes(pizza.name)
  ).map(pizza => ({
    ...pizza,
    description: getPizzaDescription(pizza),
  }));

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-xl">Loading pizzas...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-xl text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-red-400 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">C</div>
          <span className="text-xl font-bold text-gray-800">SliceCraft</span>
        </div>
        <nav className="flex items-center space-x-4">
          <Link to="/" className="text-gray-600 hover:text-red-500">Home</Link>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {user && user.role === 'admin' && (
                <Link to="/admin" className="text-gray-600 hover:text-red-500">
                  Admin Dashboard
                </Link>
              )}
              <Link to="/orders" className="text-gray-600 hover:text-red-500"><BsCartFill className="w-6 h-6" /></Link>
              <Link to="/profile" className="text-gray-600 hover:text-red-500">
                {user && user.profilePhoto ? (
                  <img
                    src={`${API_BASE_URL}${user.profilePhoto}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-600">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                )}
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/signup" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Sign Up</Link>
              <Link to="/login" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">Login</Link>
              <Link to="/admin" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">Login as Admin</Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-cover bg-center h-[500px] flex items-center justify-center text-white text-center"
        style={{ backgroundImage: 'url("/home-page-pizza.jpg")' }}
      >
        <div className="absolute inset-0 bg-opacity-40"></div> {/* Overlay for readability */}
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold mb-4">Craft Your Perfect Pizza</h1>
          <p className="text-xl mb-8">Explore our diverse menu and build the pizza of your dreams, exactly how you like it!</p>
          <Link to="/customize-pizza" className="bg-red-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-600 transition">Let's Build My Pizza!</Link>
        </div>
      </section>

      {/* Classic Favorites Section */}
      <main className="container mx-auto py-12 px-4">
        <h2 className="text-4xl font-bold text-gray-800 text-center mb-10">Our Classic Favorites</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {classicPizzas.map((pizza) => (
            <PizzaCard key={pizza._id} {...pizza} pizza={pizza} onOrderNow={handleOrderNow} />
          ))}
        </div>

        {/* Gourmet & Specialty Pizzas Section */}
        <h2 className="text-4xl font-bold text-gray-800 text-center mb-10 mt-16">Gourmet & Specialty Pizzas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {gourmetPizzas.map((pizza) => (
            <PizzaCard key={pizza._id} {...pizza} pizza={pizza} onOrderNow={handleOrderNow} />
          ))}
        </div>

        <section className="bg-orange-100 rounded-lg p-12 text-center mt-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Ready to Create Your Masterpiece?</h2>
          <p className="text-lg text-gray-700 mb-8">Unleash your culinary creativity. Start from scratch or customize any of our delicious options.</p>
          <Link to="/customize-pizza" className="bg-red-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-600 transition">Start Customizing</Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-6 text-center mt-16">
        <div className="mb-4">
          <h3 className="text-2xl font-bold mb-2">SliceCraft</h3>
          <p className="text-gray-400">Stay up to date with our latest pizzas!</p>
        </div>
        <form onSubmit={handleSubscribe} className="flex justify-center items-center space-x-2 mb-8">
          <input 
            type="email" 
            placeholder="Your email address" 
            className="p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white-800"
            value={subscribeEmail}
            onChange={(e) => setSubscribeEmail(e.target.value)}
            required
          />
          <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">Subscribe</button>
        </form>
        <div className="text-gray-500 text-sm">
          <p>&copy; 2025 SliceCraft. All rights reserved.</p>
        </div>
        {/* Social Icons - Placeholder */}
        <div className="mt-8 flex justify-end space-x-4">
          <a href="#" className="text-white hover:text-red-500"><i className="fab fa-facebook-f"></i></a> 
          <a href="#" className="text-white hover:text-red-500"><i className="fab fa-twitter"></i></a> 
          <a href="#" className="text-white hover:text-red-500"><i className="fab fa-instagram"></i></a>
        </div>
      </footer>
    </div>
  );
} 