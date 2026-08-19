"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Videos", {
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
      title: { type: Sequelize.STRING, allowNull: false },
      publisher: { type: Sequelize.STRING, allowNull: false },
      producer: { type: Sequelize.STRING, allowNull: false },
      genre: { type: Sequelize.STRING, allowNull: false },
      age_rating: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      video_url: { type: Sequelize.STRING, allowNull: false },
      original_url: { type: Sequelize.STRING, allowNull: true },
      thumbnail_url: { type: Sequelize.STRING, allowNull: true },
      duration_seconds: { type: Sequelize.INTEGER, allowNull: true },
      transcode_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      moderation_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "approved",
      },
      view_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.addIndex("Videos", ["createdAt"], {
      name: "idx_videos_created_at",
    });
    await queryInterface.addIndex("Videos", ["genre"], {
      name: "idx_videos_genre",
    });
    await queryInterface.addIndex("Videos", ["user_id"], {
      name: "idx_videos_user_id",
    });
    await queryInterface.addIndex("Videos", ["title"], {
      name: "idx_videos_title",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Videos");
  },
};
