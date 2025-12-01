const express = require("express");
const jwt = require("jsonwebtoken");
const { auth } = require("../config/firebase");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Register/Login with Firebase ID token exchange
// Frontend should send { idToken } obtained from Firebase client SDK after OTP sign-in
router.post(
  "/login",
  // Basic validation: either idToken present or (uid present in dev)
  body("idToken").optional().isString(),
  body("uid").optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        idToken,
        uid: devUid,
        phoneNumber: devPhone,
        name: devName,
        email: devEmail,
      } = req.body;

      // Development fallback when idToken is not provided
      if (!idToken) {
        if (process.env.NODE_ENV === "production") {
          return res.status(400).json({ error: "idToken is required" });
        }

        if (!devUid)
          return res.status(400).json({ error: "uid required in dev mode" });

        let user = await User.findOne({ uid: devUid });
        if (!user) {
          user = new User({
            uid: devUid,
            phoneNumber: devPhone || "",
            name: devName || "",
            email: devEmail || "",
            role: "consumer",
          });
          await user.save();
        }

        const token = jwt.sign(
          { uid: user.uid, phoneNumber: user.phoneNumber },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
        return res.json({ success: true, token, user });
      }

      // Verify the Firebase ID token
      if (!auth)
        return res
          .status(500)
          .json({ error: "Firebase Admin not initialized" });
      const decoded = await auth.verifyIdToken(idToken);

      const decodedUid = decoded.uid;
      const phoneNumber = decoded.phone_number || "";
      const email = decoded.email || "";
      const name = decoded.name || "";

      let user = await User.findOne({ uid: decodedUid });
      if (!user) {
        user = new User({
          uid: decodedUid,
          phoneNumber: phoneNumber || "",
          name: name || "",
          email: email || "",
          role: "consumer",
        });
        await user.save();
      }

      const token = jwt.sign(
        { uid: user.uid, phoneNumber: user.phoneNumber },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        token,
        user: {
          uid: user.uid,
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Auth login error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Logout
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

module.exports = router;
