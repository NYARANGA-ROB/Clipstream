"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Comments", "video_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "Videos", key: "id" },
      onDelete: "CASCADE",
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE "Comments" ALTER COLUMN "post_id" DROP NOT NULL;'
    );
    await queryInterface.addIndex("Comments", ["video_id"], {
      name: "idx_comments_video_id",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("Comments", "idx_comments_video_id");
    await queryInterface.removeColumn("Comments", "video_id");
    await queryInterface.changeColumn("Comments", "post_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
