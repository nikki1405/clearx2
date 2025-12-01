const express = require("express");
const Order = require("../models/Order");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Get user orders
router.get("/", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.uid });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create order
router.post("/", verifyToken, async (req, res) => {
  try {
    const { items, total, deliveryAddress, paymentMode } = req.body;

    const order = new Order({
      id: "ord-" + Date.now().toString().slice(-6),
      userId: req.user.uid,
      items,
      total,
      deliveryAddress,
      paymentMode,
      status: "confirmed",
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel order
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ id: req.params.id });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ success: true, message: "Order cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
