"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Rating extends Model {
    static associate(models) {
      Rating.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      Rating.belongsTo(models.Video, {
        foreignKey: "video_id",
        as: "video",
      });
    }
  }

  Rating.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      video_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
    },
    {
      sequelize,
      modelName: "Rating",
      indexes: [
        {
          unique: true,
          fields: ["user_id", "video_id"],
        },
      ],
    }
  );
  return Rating;
};
