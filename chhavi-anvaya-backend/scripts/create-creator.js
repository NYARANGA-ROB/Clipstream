#!/usr/bin/env node
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { ROLES } = require("../constants/catalog");

const [email, username, password, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ") || username;

const run = async () => {
  if (!email || !username || !password) {
    console.error(
      "Usage: node scripts/create-creator.js <email> <username> <password> [full name]"
    );
    process.exit(1);
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.error("A user with that email already exists.");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const creator = await User.create({
    email,
    username,
    password: hashedPassword,
    name,
    role: ROLES.CREATOR,
  });

  console.log(`Creator enrolled: ${creator.username} <${creator.email}>`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
