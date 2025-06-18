import mongoose from 'mongoose';

const pizzaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    base: {
        type: String,
        required: true
    },
    sauce: {
        type: String,
        required: true
    },
    cheese: {
        type: String,
        required: true
    },
    veggies: [{
        type: String
    }],
    meats: [{
        type: String
    }],
    image: {
        type: String,
        default: '/images/default-pizza.jpg'
    },
    category: {
        type: String,
        enum: ['classic', 'gourmet'],
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model('Pizza', pizzaSchema); 