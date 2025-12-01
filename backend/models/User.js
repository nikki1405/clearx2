const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  email: String,
  address: String,
  role: {
    type: String,
    enum: ["consumer", "seller", "admin"],
    default: "consumer",
  },
  sellerProfile: {
    businessName: String,
    businessAddress: String,
    gstNumber: String,
    bankAccount: String,
    category: String,
  },
  wishlist: [String],
  coins: {
    type: Number,
    default: 50,
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

module.exports = mongoose.model("User", userSchema);
