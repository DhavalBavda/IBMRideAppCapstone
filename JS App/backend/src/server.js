// import dotenv from 'dotenv';
// dotenv.config();
import app from "./app.js";
// import mongoConnect from "./config/mongo.js";
// import {checkMySqlConnection, syncSqlDatabase} from './config/mysql.js';

const PORT = process.env.PORT;
console.log(PORT)

const startServer = async () => {
    try {
        
        // await mongoConnect();

        // await checkMySqlConnection();

        // await syncSqlDatabase();

        app.listen(3000, ()=>{
            console.log(`Server running on http://localhost:${3000}`);            
        });
        
    } catch (error) {
        console.error("Error starting the server :", error.message);
        process.exit(1);
    }
}
export default startServer;