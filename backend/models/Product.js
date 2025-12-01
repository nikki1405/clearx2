const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  originalPrice: Number,
  discount: String,
  image: String,
  category: String,
  vertical: {
    type: String,
    enum: ["DEALS", "RURAL", "MAKERS"],
  },
  storeName: String,
  storeId: String,
  stock: {
    type: Number,
    default: 100,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  distance: String,
  deliveryTime: String,
  expiryDate: String,
  weight: String,
  origin: String,
  material: String,
  dimensions: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
