require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, User } = require("../models");
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

const ensureSchema = async () => {
  await sequelize.query(
    `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "bio" VARCHAR(255);`
  );
  await sequelize.query(
    `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "role" VARCHAR(255) DEFAULT 'consumer';`
  );
};

const ensureDemoUsers = async () => {
  await ensureSchema();

  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({
      where: { email: demo.email },
      attributes: ["id"],
    });
    if (existing) continue;

    await User.create(
      {
        email: demo.email,
        username: demo.username,
        name: demo.name,
        password: await bcrypt.hash(demo.password, 10),
        role: demo.role,
      },
      { validate: false }
    );
  }
};

module.exports = { ensureDemoUsers };
