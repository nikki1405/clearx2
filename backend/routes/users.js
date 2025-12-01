const express = require("express");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Get user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ uid: req.user.uid }, req.body, {
      new: true,
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user wishlist
router.get("/wishlist", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    res.json(user?.wishlist || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add to wishlist
router.post("/wishlist/add", verifyToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $addToSet: { wishlist: productId } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove from wishlist
router.post("/wishlist/remove", verifyToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $pull: { wishlist: productId } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upgrade to seller
router.post("/upgrade-seller", verifyToken, async (req, res) => {
  try {
    const { sellerProfile } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { role: "seller", sellerProfile },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
