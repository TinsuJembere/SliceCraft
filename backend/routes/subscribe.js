import express from 'express';
import Subscription from '../models/Subscription.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/subscribe
// @desc    Get all subscribers (admin only)
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const subscribers = await Subscription.find().sort({ subscribedAt: -1 });
        res.json(subscribers);
    } catch (err) {
        console.error('Error fetching subscribers:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// @route   POST /api/subscribe
// @desc    Handle email subscription
// @access  Public
router.post('/', async (req, res) => {
    const { email } = req.body;

    // Basic email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    try {
        let subscription = await Subscription.findOne({ email });

        if (subscription) {
            return res.status(409).json({ message: 'Email already subscribed.' });
        }

        subscription = new Subscription({ email });
        await subscription.save();

        res.status(200).json({ message: 'Subscription successful!' });
    } catch (err) {
        console.error('Subscription error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// @route   DELETE /api/subscribe/:id
// @desc    Remove a subscriber (admin only)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const subscription = await Subscription.findById(req.params.id);
        if (!subscription) {
            return res.status(404).json({ message: 'Subscriber not found.' });
        }

        await subscription.deleteOne();
        res.json({ message: 'Subscriber removed successfully.' });
    } catch (err) {
        console.error('Error removing subscriber:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

export default router; 