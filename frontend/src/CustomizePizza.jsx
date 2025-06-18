import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { BsCartFill } from "react-icons/bs";
import axios from 'axios'; // Import axios

const API_BASE_URL = 'https://slicecraft-1.onrender.com';

export default function CustomizePizza() {
  const [step, setStep] = useState(1);
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedSauce, setSelectedSauce] = useState(null);
  const [selectedCheese, setSelectedCheese] = useState(null);
  const [selectedVeggies, setSelectedVeggies] = useState([]);
  const [selectedMeats, setSelectedMeats] = useState([]);
  const [quantity, setQuantity] = useState(1); // New state for quantity
  const [subscribeEmail, setSubscribeEmail] = useState(''); // State for subscribe email
  const [bases, setBases] = useState([]);
  const [sauces, setSauces] = useState([]);
  const [cheeses, setCheeses] = useState([]);
  const [veggies, setVeggies] = useState([]);
  const [meats, setMeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch inventory data on component mount
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const baseRes = await axios.get(`${API_BASE_URL}/api/inventory/type/pizzaBase`);
        setBases(baseRes.data);

        const sauceRes = await axios.get(`${API_BASE_URL}/api/inventory/type/pizzaSauce`);
        setSauces(sauceRes.data);

        const cheeseRes = await axios.get(`${API_BASE_URL}/api/inventory/type/cheese`);
        console.log('Raw cheese response:', cheeseRes.data);
        console.log('First cheese item:', cheeseRes.data[0]);
        console.log('First cheese price type:', typeof cheeseRes.data[0]?.price);
        setCheeses(cheeseRes.data);

        const veggieRes = await axios.get(`${API_BASE_URL}/api/inventory/type/veggies`);
        setVeggies(veggieRes.data);

        const meatRes = await axios.get(`${API_BASE_URL}/api/inventory/type/meat`);
        setMeats(meatRes.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError('Failed to load pizza options.');
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleNext = () => {
    // Add validation before moving to the next step
    switch (step) {
      case 1:
        if (!selectedBase) return;
        break;
      case 2:
        if (!selectedSauce) return;
        break;
      case 3:
        if (!selectedCheese) return;
        break;
      // Veggies and Meats are optional, so no validation for step 4 and 5
    }
    setStep(prevStep => prevStep + 1);
  };

  const handlePrevious = () => {
    setStep(prevStep => prevStep - 1);
  };

  const handleOrderPizza = async () => {
    let pizzaPrice = 0;
    const selectedBaseObject = bases.find(base => base.name === selectedBase);
    const selectedSauceObject = sauces.find(sauce => sauce.name === selectedSauce);
    const selectedCheeseObject = cheeses.find(cheese => cheese.name === selectedCheese);

    if (selectedBaseObject && typeof selectedBaseObject.price === 'number') pizzaPrice += selectedBaseObject.price;
    if (selectedSauceObject && typeof selectedSauceObject.price === 'number') pizzaPrice += selectedSauceObject.price;
    if (selectedCheeseObject && typeof selectedCheeseObject.price === 'number') pizzaPrice += selectedCheeseObject.price;

    // Calculate price for selected veggies
    selectedVeggies.forEach(veggieName => {
      const veggieObject = veggies.find(v => v.name === veggieName);
      if (veggieObject && typeof veggieObject.price === 'number') pizzaPrice += veggieObject.price;
    });

    // Calculate price for selected meats
    selectedMeats.forEach(meatName => {
      const meatObject = meats.find(m => m.name === meatName);
      if (meatObject && typeof meatObject.price === 'number') pizzaPrice += meatObject.price;
    });

    const customPizzaItem = {
      name: "Custom Pizza",
      price: pizzaPrice,
      quantity: 1, // Use 'quantity' instead of 'qty'
      base: selectedBase,
      sauce: selectedSauce,
      cheese: selectedCheese,
      veggies: selectedVeggies,
      meats: selectedMeats,
      image: 'images/newPizza/4.png', // Default image for custom pizza
    };

    console.log("Sending to cart:", customPizzaItem);

    try {
      const token = localStorage.getItem('token'); // Changed from 'authToken'
      if (!token) {
        console.error("No authentication token found. User must be logged in to order.");
        navigate('/login');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/api/orders/add-to-cart`, customPizzaItem, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status !== 200) {
        throw new Error(response.data.message || `HTTP error! status: ${response.status}`);
      }

      const cartData = response.data;
      console.log("Item added to cart:", cartData);
      navigate('/payment');

    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add pizza to cart. Please try again.");
    }
  };

  const handleVeggieToggle = (veggieName) => {
    setSelectedVeggies(prev =>
      prev.includes(veggieName) ? prev.filter(v => v !== veggieName) : [...prev, veggieName]
    );
  };

  const handleMeatToggle = (meatName) => {
    setSelectedMeats(prev =>
      prev.includes(meatName) ? prev.filter(m => m !== meatName) : [...prev, meatName]
    );
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
      } else {
        alert("Subscription failed. Please try again.");
      }
    } catch (err) {
      console.error("Subscription error:", err);
      alert("Subscription failed. Please try again.");
    }
  };

  const renderStepContent = () => {
    if (loading) return <div className="text-center p-6">Loading pizza options...</div>;
    if (error) return <div className="text-center p-6 text-red-600">Error: {error}</div>;

    switch (step) {
      case 1:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Select Your Base</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bases.map(base => (
                <div
                  key={base._id}
                  className={`bg-white p-4 rounded-lg shadow-md cursor-pointer text-center ${selectedBase === base.name ? 'border-2 border-red-500' : ''}`}
                  onClick={() => setSelectedBase(base.name)}
                >
                  <img src={`/${base.image || 'placeholder.jpg'}`} alt={base.name} className="w-full h-24 object-cover mb-2 rounded" />
                  <h3 className="font-semibold">{base.name}</h3>
                  <p className="text-gray-600">${typeof base.price === 'number' ? base.price.toFixed(2) : 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Choose Your Sauce</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sauces.map(sauce => (
                <div
                  key={sauce._id}
                  className={`bg-white p-4 rounded-lg shadow-md cursor-pointer text-center ${selectedSauce === sauce.name ? 'border-2 border-red-500' : ''}`}
                  onClick={() => setSelectedSauce(sauce.name)}
                >
                  <h3 className="font-semibold">{sauce.name}</h3>
                  <p className="text-gray-600">${typeof sauce.price === 'number' ? sauce.price.toFixed(2) : 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        console.log("Cheeses fetched:", cheeses);
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Select a Cheese Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cheeses.map(cheese => {
                console.log("Current cheese object:", cheese);
                return (
                <div
                  key={cheese._id}
                  className={`bg-white p-4 rounded-lg shadow-md cursor-pointer text-center ${selectedCheese === cheese.name ? 'border-2 border-red-500' : ''}`}
                  onClick={() => setSelectedCheese(cheese.name)}
                >
                  <h3 className="font-semibold">{cheese.name}</h3>
                  <p className="text-gray-600">${typeof cheese.price === 'number' ? cheese.price.toFixed(2) : 'N/A'}</p>
                </div>
              )})}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Add Vegetables (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {veggies.map(veggie => (
                <div
                  key={veggie._id}
                  className={`bg-white p-4 rounded-lg shadow-md cursor-pointer text-center ${selectedVeggies.includes(veggie.name) ? 'border-2 border-red-500' : ''}`}
                  onClick={() => handleVeggieToggle(veggie.name)}
                >
                  <h3 className="font-semibold">{veggie.name}</h3>
                  <p className="text-gray-600">${typeof veggie.price === 'number' ? veggie.price.toFixed(2) : 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Add Meats (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {meats.map(meat => (
                <div
                  key={meat._id}
                  className={`bg-white p-4 rounded-lg shadow-md cursor-pointer text-center ${selectedMeats.includes(meat.name) ? 'border-2 border-red-500' : ''}`}
                  onClick={() => handleMeatToggle(meat.name)}
                >
                  <h3 className="font-semibold">{meat.name}</h3>
                  <p className="text-gray-600">${typeof meat.price === 'number' ? meat.price.toFixed(2) : 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Review Your Custom Pizza</h2>
            <div className="bg-gray-50 p-4 rounded-lg shadow-inner mb-6">
              <p className="text-lg font-semibold text-gray-700 mb-2">Your Pizza:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {selectedBase && <li>Base: <span className="font-medium">{selectedBase}</span></li>}
                {selectedSauce && <li>Sauce: <span className="font-medium">{selectedSauce}</span></li>}
                {selectedCheese && <li>Cheese: <span className="font-medium">{selectedCheese}</span></li>}
                {selectedVeggies.length > 0 && <li>Veggies: <span className="font-medium">{selectedVeggies.join(', ')}</span></li>}
                {selectedMeats.length > 0 && <li>Meats: <span className="font-medium">{selectedMeats.join(', ')}</span></li>}
              </ul>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label htmlFor="quantity" className="block text-lg font-semibold text-gray-700 mb-2">Quantity:</label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 p-3 border border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="text-right text-3xl font-bold text-red-600">
              Total Price: ${renderCurrentPrice().toFixed(2)}
            </div>
          </div>
        );
      default:
        return <div className="p-6">Unknown step.</div>;
    }
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1:
        return !selectedBase;
      case 2:
        return !selectedSauce;
      case 3:
        return !selectedCheese;
      case 4:
        return false; // Veggies are optional
      case 5:
        return false; // Meats are optional
      case 6:
        return quantity < 1; // Disable if quantity is less than 1
      default:
        return false;
    }
  };

  const renderCurrentPrice = () => {
    let price = 0;

    const basePrice = bases.find(b => b.name === selectedBase)?.price || 0;
    const saucePrice = sauces.find(s => s.name === selectedSauce)?.price || 0;
    const cheesePrice = cheeses.find(c => c.name === selectedCheese)?.price || 0;

    price += typeof basePrice === 'number' ? basePrice : 0;
    price += typeof saucePrice === 'number' ? saucePrice : 0;
    price += typeof cheesePrice === 'number' ? cheesePrice : 0;

    selectedVeggies.forEach(veggieName => {
      const veggiePrice = veggies.find(v => v.name === veggieName)?.price || 0;
      price += typeof veggiePrice === 'number' ? veggiePrice : 0;
    });

    selectedMeats.forEach(meatName => {
      const meatPrice = meats.find(m => m.name === meatName)?.price || 0;
      price += typeof meatPrice === 'number' ? meatPrice : 0;
    });

    return price * quantity; // Multiply by quantity
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          <Link to="/orders" className="text-gray-600 hover:text-red-500"><BsCartFill className="w-6 h-6" /></Link>
          {isAuthenticated ? (
            <>
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
              {/* Payment Icon */}
              <Link to="/payment">
                <i className="fas fa-credit-card w-6 h-6 text-gray-600 hover:text-red-500 transition-colors"></i>
              </Link>
              <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-red-500">Login</Link>
              <Link to="/signup" className="text-gray-600 hover:text-red-500">Sign Up</Link>
            </>
          )}
        </nav>
      </header>

      <main className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Customize Your Pizza</h1>
        <p className="text-lg text-gray-600 mb-10">Select your favorite ingredients to create the perfect pizza.</p>

        {/* Step Indicators */}
        <div className="flex justify-between items-center mb-10 relative">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${s <= step ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  {s}
                </div>
                <span className={`mt-2 text-sm ${s === step ? 'font-semibold text-red-500' : 'text-gray-600'}`}>
                  {s === 1 ? 'Base' : s === 2 ? 'Sauce' : s === 3 ? 'Cheese' : s === 4 ? 'Veggies' : s === 5 ? 'Meats' : 'Review'}
                </span>
              </div>
              {s < 6 && (
                <div className={`flex-1 h-1 ${s < step ? 'bg-red-500' : 'bg-gray-300'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-lg shadow-md p-6">
          {/* Left Column: Pizza Visual (Placeholder) */}
          <div className="flex items-center justify-center">
            <img src="/home-page-pizza.jpg" alt="Custom Pizza" className="w-full max-w-md rounded-lg shadow-lg" />
          </div>

          {/* Right Column: Step Content */}
          <div className="flex flex-col">
            {renderStepContent()}
            <div className="flex justify-between mt-auto pt-6">
              {step > 1 && (
                <button
                  onClick={handlePrevious}
                  disabled={step === 1}
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-gray-400 transition"
                >
                  Previous
                </button>
              )}

              {step < 6 ? (
                <button
                  onClick={handleNext}
                  disabled={isNextDisabled()}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-red-600 transition"
                >
                  Next Step <span aria-hidden="true">&rarr;</span>
                </button>
              ) : (
                <button
                  onClick={handleOrderPizza}
                  className="bg-green-600 text-white px-6 py-3 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Order Pizza
                </button>
              )}
            </div>
          </div>
        </div>
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
        <div className="mt-8 flex justify-center space-x-4">
        </div>
      </footer>
    </div>
  );
} 