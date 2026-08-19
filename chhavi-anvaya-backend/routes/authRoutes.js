const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const { signUp, signIn, createCreator, signOut } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/creators", createCreator);
router.post("/signout", signOut);

router.get("/verify_token", authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;
