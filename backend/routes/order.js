const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

// Initialize Razorpay with test credentials
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_51HhQ2KZxZvXe2',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_test_key_secret'
});

// Configure email transporter
let transporter;
if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport(sendgridTransport({
        auth: {
            api_key: process.env.SENDGRID_API_KEY
        }
    }));
} else {
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: process.env.ETHEREAL_USER || 'ethereal_user',
            pass: process.env.ETHEREAL_PASS || 'ethereal_pass'
        }
    });
}

// Create order
router.post('/', auth, async (req, res) => {
    try {
        const { items, deliveryAddress } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Invalid order items' });
        }

        // Calculate total amount
        const totalAmount = items.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);

        if (totalAmount <= 0) {
            return res.status(400).json({ message: 'Invalid order amount' });
        }

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: {
                userId: req.user.userId.toString()
            }
        });

        // Create order in database
        const order = new Order({
            user: req.user.userId,
            items,
            totalAmount,
            deliveryAddress,
            paymentId: razorpayOrder.id,
            status: 'pending'
        });

        await order.save();

        // Return order details with test card information
        res.json({
            orderId: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: totalAmount,
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_51HhQ2KZxZvXe2',
            testCardDetails: {
                cardNumber: '4111 1111 1111 1111',
                expiry: '12/25',
                cvv: '123',
                name: 'Test User',
                otp: '1234'
            }
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ 
            message: 'Error creating order', 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Verify payment and update order
router.post('/verify-payment', auth, async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        // In test mode, we'll accept any payment
        if (process.env.NODE_ENV === 'development') {
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            order.paymentStatus = 'completed';
            order.status = 'order_received';
            await order.save();

            // Update inventory
            for (const item of order.items) {
                const pizza = await Pizza.findById(item.pizza);
                if (pizza) {
                    // Update base inventory
                    await Inventory.findOneAndUpdate(
                        { itemType: 'base', name: pizza.base },
                        { $inc: { quantity: -item.quantity } }
                    );

                    // Update sauce inventory
                    await Inventory.findOneAndUpdate(
                        { itemType: 'sauce', name: pizza.sauce },
                        { $inc: { quantity: -item.quantity } }
                    );

                    // Update cheese inventory
                    await Inventory.findOneAndUpdate(
                        { itemType: 'cheese', name: pizza.cheese },
                        { $inc: { quantity: -item.quantity } }
                    );

                    // Update veggies inventory
                    for (const veggie of pizza.veggies) {
                        await Inventory.findOneAndUpdate(
                            { itemType: 'veggie', name: veggie },
                            { $inc: { quantity: -item.quantity } }
                        );
                    }
                }
            }

            return res.json({ 
                message: 'Payment verified and order updated successfully',
                order
            });
        }

        // In production, verify the signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        if (generatedSignature !== signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Update order status
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.paymentStatus = 'completed';
        order.status = 'order_received';
        await order.save();

        // Update inventory
        for (const item of order.items) {
            const pizza = await Pizza.findById(item.pizza);
            if (pizza) {
                // Update base inventory
                await Inventory.findOneAndUpdate(
                    { itemType: 'base', name: pizza.base },
                    { $inc: { quantity: -item.quantity } }
                );

                // Update sauce inventory
                await Inventory.findOneAndUpdate(
                    { itemType: 'sauce', name: pizza.sauce },
                    { $inc: { quantity: -item.quantity } }
                );

                // Update cheese inventory
                await Inventory.findOneAndUpdate(
                    { itemType: 'cheese', name: pizza.cheese },
                    { $inc: { quantity: -item.quantity } }
                );

                // Update veggies inventory
                for (const veggie of pizza.veggies) {
                    await Inventory.findOneAndUpdate(
                        { itemType: 'veggie', name: veggie },
                        { $inc: { quantity: -item.quantity } }
                    );
                }
            }
        }

        // Check inventory levels and send notification if needed
        const lowInventory = await Inventory.find({ $expr: { $lte: ['$quantity', '$threshold'] } });
        if (lowInventory.length > 0) {
            await transporter.sendMail({
                to: process.env.ADMIN_EMAIL,
                from: process.env.ADMIN_EMAIL,
                subject: 'Low Inventory Alert',
                html: `
                    <h2>Low Inventory Alert</h2>
                    <p>The following items are running low:</p>
                    <ul>
                        ${lowInventory.map(item => `
                            <li>${item.name} (${item.itemType}): ${item.quantity} ${item.unit} remaining</li>
                        `).join('')}
                    </ul>
                `
            });
        }

        res.json({ message: 'Payment verified and order updated successfully' });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ 
            message: 'Error verifying payment', 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId })
            .populate('items.pizza')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// Update order status (admin only)
router.put('/:id/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        // Notify user about status change
        const user = await User.findById(order.user);
        if (user) {
            await transporter.sendMail({
                to: user.email,
                from: process.env.ADMIN_EMAIL,
                subject: 'Order Status Update',
                html: `
                    <h2>Order Status Update</h2>
                    <p>Your order #${order._id} status has been updated to: ${status}</p>
                `
            });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
});

module.exports = router; 