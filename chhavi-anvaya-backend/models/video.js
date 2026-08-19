"use strict";
const { Model } = require("sequelize");
const { GENRES, AGE_RATINGS } = require("../constants/catalog");

module.exports = (sequelize, DataTypes) => {
  class Video extends Model {
    static associate(models) {
      Video.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "creator",
      });
      Video.hasMany(models.Comment, {
        foreignKey: "video_id",
        as: "comments",
      });
      Video.hasMany(models.Rating, {
        foreignKey: "video_id",
        as: "ratings",
      });
    }
  }

  Video.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      publisher: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      producer: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      genre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [GENRES] },
      },
      age_rating: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [AGE_RATINGS] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      video_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      original_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      thumbnail_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      duration_seconds: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      transcode_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      moderation_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "approved",
      },
      view_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Video",
    }
  );
  return Video;
};
