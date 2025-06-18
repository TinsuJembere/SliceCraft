import express from 'express';
import Inventory from '../models/Inventory.js';
import auth from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import sendgridTransport from 'nodemailer-sendgrid-transport';

const router = express.Router();

// Configure SendGrid transporter
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
}));

// Get all inventory items (admin only)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const inventory = await Inventory.find().sort({ itemType: 1, name: 1 });
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inventory', error: error.message });
    }
});

// Add new inventory item (admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { itemType, name, quantity, threshold, unit, price } = req.body;

        // Check if item already exists
        const existingItem = await Inventory.findOne({ itemType, name });
        if (existingItem) {
            return res.status(400).json({ message: 'Item already exists in inventory' });
        }

        const inventoryItem = new Inventory({
            itemType,
            name,
            quantity,
            threshold,
            unit,
            price
        });

        await inventoryItem.save();
        res.status(201).json(inventoryItem);
    } catch (error) {
        res.status(500).json({ message: 'Error adding inventory item', error: error.message });
    }
});

// Update inventory item (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        console.log('Updating inventory item:', req.params.id);
        console.log('Request body:', req.body);
        console.log('User:', req.user);

        if (req.user.role !== 'admin') {
            console.log('User not authorized:', req.user);
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { quantity, threshold } = req.body;

        // Validate input
        if (quantity === undefined || threshold === undefined) {
            return res.status(400).json({ message: 'Quantity and threshold are required' });
        }

        if (isNaN(quantity) || isNaN(threshold)) {
            return res.status(400).json({ message: 'Quantity and threshold must be numbers' });
        }

        if (quantity < 0 || threshold < 0) {
            return res.status(400).json({ message: 'Quantity and threshold must be positive numbers' });
        }

        const inventoryItem = await Inventory.findById(req.params.id);

        if (!inventoryItem) {
            console.log('Inventory item not found:', req.params.id);
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        // Check if quantity is below threshold after update
        if (quantity <= threshold) {
            try {
                await transporter.sendMail({
                    to: process.env.ADMIN_EMAIL,
                    from: process.env.ADMIN_EMAIL,
                    subject: 'Low Inventory Alert',
                    html: `
                        <h2>Low Inventory Alert</h2>
                        <p>The following item is running low:</p>
                        <ul>
                            <li>${inventoryItem.name} (${inventoryItem.itemType}): ${quantity} ${inventoryItem.unit} remaining</li>
                        </ul>
                    `
                });
                console.log('Low inventory alert email sent');
            } catch (emailError) {
                console.error('Error sending low inventory alert:', emailError);
                // Don't fail the update if email fails
            }
        }

        inventoryItem.quantity = quantity;
        inventoryItem.threshold = threshold;
        inventoryItem.lastRestocked = Date.now();

        const updatedItem = await inventoryItem.save();
        console.log('Inventory item updated successfully:', updatedItem);
        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating inventory item:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error updating inventory item', error: error.message });
    }
});

// Delete inventory item (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const inventoryItem = await Inventory.findByIdAndDelete(req.params.id);
        if (!inventoryItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        res.json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
    }
});

// Get inventory by type
router.get('/type/:itemType', async (req, res) => {
    try {
        // No authentication required for this public endpoint
        const inventory = await Inventory.find({ itemType: req.params.itemType, quantity: { $gt: 0 } }); // Only show items with quantity > 0
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inventory by type', error: error.message });
    }
});

export default router; 