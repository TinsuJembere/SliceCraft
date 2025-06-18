import express from 'express';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js'; // Import Inventory model
import auth from '../middleware/auth.js';
import path from 'path';
import mongoose from 'mongoose';
import isAdmin from '../middleware/isAdmin.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// @route   POST api/orders/add-to-cart
// @desc    Add item to user's cart (or create a new cart if none exists)
// @access  Private
router.post('/add-to-cart', auth, async (req, res) => {
  const item = req.body;
  const userId = req.user.id;

  // Validate incoming item, now checking for 'quantity'
  if (!item || typeof item !== 'object' || item.price === undefined || typeof item.price !== 'number' || item.quantity === undefined || typeof item.quantity !== 'number') {
    console.error('Invalid item received for cart:', item);
    return res.status(400).json({ message: 'Invalid item data provided. Price or quantity is missing or invalid.' });
  }

  try {
    // Find an existing pending order (cart) or create a new one
    let cart = await Order.findOne({ user: userId, status: 'pending' });

    if (!cart) {
      cart = new Order({
        user: userId,
        items: [],
        totalAmount: 0,
        // Delivery address can be added later
        deliveryAddress: {
          street: 'N/A',
          city: 'N/A',
          state: 'N/A',
          zipCode: '00000',
          country: 'N/A'
        }
      });
    }

    // Add the new item to the cart
    cart.items.push(item);

    // Recalculate the total amount based on all items in the cart
    cart.totalAmount = cart.items.reduce((acc, currentItem) => {
      // Ensure each item in the cart is valid before calculating total
      if (currentItem && typeof currentItem.price === 'number' && typeof currentItem.quantity === 'number') {
        return acc + (currentItem.price * currentItem.quantity);
      }
      return acc;
    }, 0);

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error('Error adding to cart:', err);
    // Provide more specific error feedback if it's a validation error
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: err.errors });
    }
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @route   POST api/orders/place-order
// @desc    Place an order (finalize pending cart with delivery address and total amount)
// @access  Private
router.post('/place-order', auth, async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.postalCode) {
      return res.status(400).json({ message: 'Delivery address details are required' });
    }

    const order = new Order({
      user: req.user.id,
      items,
      totalAmount,
      deliveryAddress,
      status: 'pending'
    });

    const savedOrder = await order.save();
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: savedOrder
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET api/orders/me/cart
// @desc    Get current user's active cart
// @access  Private
router.get('/me/cart', auth, async (req, res) => {
  try {
    // Fetch any order that is not completed or cancelled, prioritizing the most recent.
    const cart = await Order.findOne({ 
      user: req.user.id, 
      status: { $nin: ['completed', 'cancelled'] } 
    }).sort({ createdAt: -1 });

    if (!cart) {
      return res.json({ items: [], totalAmount: 0 }); // Return an empty cart if no active order found
    }

    res.json(cart);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @route   GET api/orders/user/:userId
// @desc    Get all orders for a specific user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    console.log("Fetching orders for user:", req.params.userId);
    console.log("Requesting user:", req.user);
    
    // Check if the requesting user is either the user in question or an admin
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      console.log("Access denied: User is not the owner or an admin");
      return res.status(403).json({ message: "Access denied" });
    }

    const orders = await Order.find({ user: req.params.userId })
      .sort({ createdAt: -1 }); // Sort by most recent first
    
    console.log(`Found ${orders.length} orders for user ${req.params.userId}`);
    console.log("Orders:", orders);
    
    res.json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// @route   GET api/orders/admin
// @desc    Get all orders for admin
// @access  Private (Admin Only)
router.get('/admin', auth, isAdmin, async (req, res) => {
  try {
    console.log("Admin fetching all orders");
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    console.log(`Found ${orders.length} orders`);
    res.json(orders);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// @route   GET api/orders/cart
// @desc    Get the current user's cart (pending order)
// @access  Private
router.get('/cart', auth, async (req, res) => {
  try {
    const cart = await Order.findOne({ user: req.user.id, status: 'pending' });
    if (!cart) {
      return res.status(404).json({ message: 'No active cart found' });
    }
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/orders/:orderId
// @desc    Get a single order by ID
// @access  Private
router.get('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "user",
      "name email"
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the user is the order owner or an admin
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (err) {
    console.error("Error fetching single order:", err);
    res.status(500).json({ message: "Error fetching order" });
  }
});

// @route   PUT api/orders/:orderId/status
// @desc    Update order status (Admin Only)
// @access  Private (Admin Only)
router.put('/:orderId/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Error updating order status" });
  }
});

// @route   DELETE api/orders/:orderId
// @desc    Delete an order
// @access  Private
router.delete('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the user is the order owner or an admin
    if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this order" });
    }

    await order.deleteOne();
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ message: "Error deleting order" });
  }
});

// Get all orders for the authenticated user
router.get('/me', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get the current user's cart (pending order)
router.get('/cart', auth, async (req, res) => {
  try {
    console.log('Fetching cart for user:', req.user.id);
    
    const cart = await Order.findOne({ 
      user: req.user.id, 
      status: 'pending' 
    });

    if (!cart) {
      console.log('No active cart found for user:', req.user.id);
      return res.status(404).json({ 
        message: 'No active cart found',
        items: []
      });
    }

    console.log('Cart found:', cart);
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ 
      message: 'Server error while fetching cart',
      error: error.message 
    });
  }
});

// @route   PUT api/orders/place-order
// @desc    Place an order (update pending order)
// @access  Private
router.put('/place-order', [auth, upload.single('transferScreenshot')], async (req, res) => {
  try {
    console.log('Placing order for user:', req.user.id);
    console.log('Request body:', req.body);
    console.log('File:', req.file);

    const cart = await Order.findOne({ user: req.user.id, status: 'pending' });

    if (!cart) {
      return res.status(404).json({ message: 'No active cart found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Transfer screenshot is required' });
    }

    // Parse the delivery address from the JSON string
    const parsedAddress = JSON.parse(req.body.deliveryAddress);

    cart.deliveryAddress = parsedAddress;
    cart.status = 'Order Received';
    cart.transferScreenshot = `/uploads/${req.file.filename}`;

    await cart.save();
    console.log('Order placed successfully:', cart);
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error placing order:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders (admin only)
router.get("/", auth, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email");
    res.json(orders);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// Create a new order
router.post("/", auth, async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      user: req.user.id,
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Error creating order" });
  }
});

// Update order status (admin only)
router.patch("/:id/status", auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = req.body.status;
    await order.save();
    res.json(order);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Error updating order status" });
  }
});

// Delete an order
router.delete("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the user is the owner of the order or an admin
    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this order" });
    }

    // Only allow cancellation of orders in 'Order Received' status
    if (order.status !== 'Order Received') {
      return res.status(400).json({ message: "Can only cancel orders that are in 'Order Received' status" });
    }

    await order.deleteOne();
    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ message: "Error deleting order" });
  }
});

export default router; 