"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Ratings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      video_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Videos", key: "id" },
        onDelete: "CASCADE",
      },
      score: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.addIndex("Ratings", ["user_id", "video_id"], {
      unique: true,
      name: "idx_ratings_user_video_unique",
    });
    await queryInterface.addIndex("Ratings", ["video_id"], {
      name: "idx_ratings_video_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Ratings");
  },
};
