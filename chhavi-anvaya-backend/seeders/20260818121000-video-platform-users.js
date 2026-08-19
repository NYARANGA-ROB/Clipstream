"use strict";
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const hashedCreator = await bcrypt.hash("Creator123", 10);
    const hashedViewer = await bcrypt.hash("Viewer123", 10);

    await queryInterface.bulkInsert("Users", [
      {
        username: "studio",
        name: "Clipstream Studio",
        email: "creator@clipstream.local",
        password: hashedCreator,
        contact_number: "0700000001",
        verification: true,
        role: "creator",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "viewer",
        name: "Clipstream Viewer",
        email: "viewer@clipstream.local",
        password: hashedViewer,
        contact_number: "0700000002",
        verification: true,
        role: "consumer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.sequelize.query(
      `UPDATE "Users" SET role = 'creator' WHERE username = 'chhavi_anvaya'`
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Users", {
      username: ["studio", "viewer"],
    });
  },
};
