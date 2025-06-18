import express from 'express';
import Pizza from '../models/Pizza.js';

const router = express.Router();

// Get all pizzas (public endpoint)
router.get('/', async (req, res) => {
    try {
        const pizzas = await Pizza.find();
        res.json(pizzas);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pizzas', error: error.message });
    }
});

export default router; 