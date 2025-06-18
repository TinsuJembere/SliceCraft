import React from 'react';

export default function PizzaCard({ image, title, description, price, pizza, onOrderNow }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-red-600">${price?.toFixed(2) || 'N/A'}</span>
          <button 
            onClick={() => onOrderNow(pizza)}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
          >
            Order Now
          </button>
        </div>
      </div>
    </div>
  );
} 