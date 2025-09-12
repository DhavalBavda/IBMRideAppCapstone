import { DataTypes } from "sequelize";
import {sequelize} from "../config/mysql.js"; // adjust path to your sequelize instance

const User = sequelize.define(
    "User",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, // equivalent to DEFAULT (UUID())
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
            unique: {
                name: "unique_email",
                msg: "Email must be unique",
            },
            validate: {
                isEmail: {
                    msg: "Invalid email format",
                },
            },
        },
        phone: {
            type: DataTypes.STRING(15),
            allowNull: false,
            unique: {
                name: "unique_phone",
                msg: "Phone must be unique",
            },
            validate: {
                isNumeric: {
                    msg: "Phone must contain only digits",
                },
            },
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM("rider", "driver", "admin"),
            allowNull: false,
            defaultValue: "rider",
            validate: {
                isIn: {
                    args: [["rider", "driver", "admin"]],
                    msg: "Invalid role. Allowed values: rider, driver, admin",
                },
            },
        },
        profile_image_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
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
            allowNull: true,
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
            allowNull: true,
        },
        license_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: {
                name: "unique_license",
                msg: "License number must be unique",
            },
        },
        license_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        license_expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        aadhar_number: {
            type: DataTypes.STRING(12),
            allowNull: false,
            unique: {
                name: "unique_aadhar",
                msg: "Aadhar must be unique",
            },
            validate: {
                len: {
                    args: [12, 12],
                    msg: "Aadhar must be exactly 12 digits",
                },
                isNumeric: {
                    msg: "Aadhar must contain only digits",
                },
            },
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
            allowNull: true,
        },
        verified_by: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: false, // since we manually handle created_at & updated_at
        tableName: "users",
        indexes: [
            { name: "idx_email", fields: ["email"] },
            { name: "idx_phone", fields: ["phone"] },
            { name: "idx_role", fields: ["role"] },
            { name: "idx_status", fields: ["account_status"] },
            { name: "idx_created", fields: ["created_at"] },
        ],
    }
);

export default User;
