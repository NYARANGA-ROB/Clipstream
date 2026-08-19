const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { ROLES } = require("../constants/catalog");

const passwordStrengthRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  name: user.name,
  role: user.role || ROLES.CONSUMER,
});

const generateJwtToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role || ROLES.CONSUMER,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

const signUp = async (req, res) => {
  const { email, username, password, mobile, fullName } = req.body;
  try {
    if (!email || !username || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email ID already in use." });
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername)
      return res.status(400).json({ message: "Username already in use." });

    if (!passwordStrengthRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and contain letters and numbers",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      username,
      password: hashedPassword,
      contact_number: mobile,
      name: fullName,
      role: ROLES.CONSUMER,
    });

    res.status(201).json({ success: true, user: publicUser(newUser) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

const signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const user = await User.findOne({
      where: { email },
      attributes: ["id", "email", "username", "name", "password", "role"],
    });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ message: "Auth is not configured" });
    }

    const token = generateJwtToken(user);

    try {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 3600000,
      });
    } catch (cookieError) {
      console.error("Could not set auth cookie:", cookieError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Signed in successfully",
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const createCreator = async (req, res) => {
  const expected = process.env.CREATOR_INVITE_SECRET;
  const provided = req.get("x-creator-invite-secret");

  if (!expected || provided !== expected) {
    return res.status(403).json({ message: "Creator enrolment is not public." });
  }

  const { email, username, password, fullName } = req.body;
  try {
    if (!email || !username || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!passwordStrengthRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and contain letters and numbers",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email ID already in use." });
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername)
      return res.status(400).json({ message: "Username already in use." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const creator = await User.create({
      email,
      username,
      password: hashedPassword,
      name: fullName,
      role: ROLES.CREATOR,
    });

    return res.status(201).json({
      success: true,
      message: "Creator account created",
      user: publicUser(creator),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong." });
  }
};

const signOut = (_req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ success: true });
};

module.exports = { signUp, signIn, createCreator, signOut };
