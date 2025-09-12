import { Sequelize } from "sequelize";
import mysql from "mysql2/promise";

import dotenv from "dotenv";

dotenv.config();

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;


const createDatabaseIfNotExists = async () => {
  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPass,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database "${dbName}" is ready`);
    await connection.end();
  } catch (error) {
    console.error("Error creating database:", error);
    throw error;
  }
};

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: "mysql",
  logging: false,
});

const checkMySqlConnection = async () => {
  try {
    await createDatabaseIfNotExists(); 
    await sequelize.authenticate();
    console.log("MySQL Connected using Sequelize");
  } catch (error) {
    console.error("MySQL Connection Error:", error.message);
    throw error;
  }
};

const syncSqlDatabase = async () => {
  try {
    await sequelize.sync(); 
    console.log("MySQL database synchronized successfully.");
  } catch (error) {
    console.error(" Error syncing database:", error.message);
    throw error;
  }
};

export { sequelize, checkMySqlConnection, syncSqlDatabase };