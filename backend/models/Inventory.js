import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    itemType: {
        type: String,
        enum: ['base', 'sauce', 'cheese', 'veggie', 'meat'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    threshold: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    lastRestocked: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Add index for efficient querying
inventorySchema.index({ itemType: 1, name: 1 }, { unique: true });

export default mongoose.model('Inventory', inventorySchema);