const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subscriber = require('../models/Subscriber');

// Get all subscribers (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (err) {
    console.error('Error fetching subscribers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new subscriber
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if email already exists
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }

    // Create new subscriber
    const subscriber = new Subscriber({
      email
    });

    await subscriber.save();
    res.status(201).json(subscriber);
  } catch (err) {
    console.error('Error adding subscriber:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete subscriber (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    await subscriber.remove();
    res.json({ message: 'Subscriber removed successfully' });
  } catch (err) {
    console.error('Error deleting subscriber:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 