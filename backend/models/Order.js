const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  items: [
    {
      id: String,
      name: String,
      price: Number,
      quantity: Number,
      vertical: String,
    },
  ],
  total: Number,
  status: {
    type: String,
    enum: ["confirmed", "processing", "shipped", "delivered", "cancelled"],
    default: "confirmed",
  },
  deliveryAddress: String,
  paymentMode: String,
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
