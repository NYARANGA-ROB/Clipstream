require("dotenv").config();
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { ROLES } = require("../constants/catalog");

const DEMO_USERS = [
  {
    email: "creator@clipstream.local",
    username: "studio",
    name: "Clipstream Studio",
    password: "Creator123",
    role: ROLES.CREATOR,
  },
  {
    email: "viewer@clipstream.local",
    username: "viewer",
    name: "Clipstream Viewer",
    password: "Viewer123",
    role: ROLES.CONSUMER,
  },
];

const ensureDemoUsers = async () => {
  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ where: { email: demo.email } });
    if (existing) continue;

    await User.create(
      {
        email: demo.email,
        username: demo.username,
        name: demo.name,
        password: await bcrypt.hash(demo.password, 10),
        role: demo.role,
        verification: true,
      },
      { validate: false }
    );
  }
};

module.exports = { ensureDemoUsers };
