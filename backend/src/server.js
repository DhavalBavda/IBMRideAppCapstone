import config from './config/Config.js';
import app from "./app.js";
import mongoConnect from "./config/mongo.js";
import {checkMySqlConnection, syncSqlDatabase} from './config/mysql.js';
import redisClient from './config/redisClient.js';

const PORT = config.NODE_PORT;

const startServer = async () => {
    try {
        
        await mongoConnect();

        await checkMySqlConnection();

        await syncSqlDatabase();

        await redisClient.checkRedisConnection();

        app.listen(PORT || 3000, ()=>{
            console.log(`Server running on http://localhost:${3000}`);            
        });

    } catch (error) {
        console.error("Error starting the server :", error.message);
        process.exit(1);
    }
}
export default startServer;