import { DataTypes } from "sequelize";
import {sequelize} from "../config/mysql.js"; // your DB connection

const User = sequelize.define("User", {
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firstname: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  lastname: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("rider", "driver", "admin"),
    defaultValue: "rider",
    allowNull: false,
  },
  profile_image_url: {
    type: DataTypes.STRING(500),
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  account_status: {
    type: DataTypes.ENUM("active", "inactive", "suspended", "deleted"),
    defaultValue: "active",
  },
  last_login_at: {
    type: DataTypes.DATE,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  deleted_at: {
    type: DataTypes.DATE,
  },
  license_number: {
  type: DataTypes.STRING(50),
  unique: true,
  allowNull: true, // changed from false to true
},
license_url: {
  type: DataTypes.STRING(500),
  allowNull: true,
},
license_expiry_date: {
  type: DataTypes.DATEONLY,
  allowNull: true, // changed from false to true
},
aadhar_number: {
  type: DataTypes.STRING(12),
  unique: true,
  allowNull: true, // changed from false to true
},
aadhar_url: {
  type: DataTypes.STRING(500),
  allowNull: true,
},
  verification_status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },
  verification_notes: {
    type: DataTypes.TEXT,
  },
  verified_by: {
    type: DataTypes.UUID,
  },
  verified_at: {
    type: DataTypes.DATE,
  },
}, {
  tableName: "users",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  paranoid: true, // enables soft delete (deleted_at)
  deletedAt: "deleted_at",
  indexes: [
    { fields: ["role"] },
    { fields: ["account_status"] },
    { fields: ["created_at"] },
  ],
});

export default User;
