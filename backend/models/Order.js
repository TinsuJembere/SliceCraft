import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        base: { type: String },
        sauce: { type: String },
        cheese: { type: String },
        veggies: [String],
        meats: [String],
        size: { type: String },
        extraCheese: { type: Boolean },
        extraSauce: { type: Boolean },
        notes: { type: String },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "Order Received",
        "Preparing",
        "In Oven",
        "Ready for Pickup",
        "Out for Delivery",
        "Delivered",
        "completed",
        "cancelled"
      ],
      default: "pending",
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    transferScreenshot: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;