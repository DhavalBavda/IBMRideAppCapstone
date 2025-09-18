import http from "http";
import { Server } from "socket.io";

import config from "./config/Config.js";
import app from "./app.js";
import mongoConnect from "./config/mongo.js";
import { checkMySqlConnection, syncSqlDatabase } from "./config/mysql.js";
import redisClient from "./config/redisClient.js";
import { initSocket } from "./sockets/index.js";

const PORT = config.NODE_PORT;

const startServer = async () => {
  try {
    // DB + Redis connections
    await mongoConnect();
    await checkMySqlConnection();
    await syncSqlDatabase();
    await redisClient.checkRedisConnection();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO on the same server
    initSocket(server);

    // Start listening
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Error starting the server:", error.message);
    process.exit(1);
  }
};

export default startServer;