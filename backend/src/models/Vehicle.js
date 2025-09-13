import { DataTypes } from "sequelize";
import { sequelize } from "../config/mysql.js";
import User from "./User.js";

const Vehicle = sequelize.define(
  "Vehicle",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "uuid",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    make: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { notEmpty: true, len: [2, 50] },
    },
    model: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { notEmpty: true },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1990,
        max: new Date().getFullYear() + 1,
      },
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: { notEmpty: true },
    },

    //Validation for Indian Standard format 
    registration_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        is: {
          args: /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/,
          msg: "Invalid vehicle registration number.",
        },
      },
    },
    vehicle_type: {
      type: DataTypes.ENUM("hatchback", "sedan", "suv", "auto", "bike"),
      allowNull: false,
      validate: {
        isIn: [["hatchback", "sedan", "suv", "auto", "bike"]],
      },
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      validate: { isIn: [["active", "inactive"]] },
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "vehicles",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ["owner_id"], name: "idx_owner_id" },
      { fields: ["registration_number"], unique: true, name: "idx_registration" },
      { fields: ["status"], name: "idx_status" },
      { fields: ["vehicle_type"], name: "idx_type" },
    ],
  }
);


Vehicle.belongsTo(User, { foreignKey: "owner_id", as: "owner", onDelete: "CASCADE", onUpdate: "CASCADE" });
User.hasMany(Vehicle, { foreignKey: "owner_id", as: "vehicles", onDelete: "CASCADE", onUpdate: "CASCADE" });

export default Vehicle;
