import mongoose from "mongoose";

const mongo_uri = process.env.MONGO_URI || "mongodb+srv://dhavalbavdas:dhavalbavda@cluster0.cmmcity.mongodb.net/"; 

const mongoConnect = async () => {
    try {
        await mongoose.connect(mongo_uri)
        console.log('Connected to MongoDB');
    } catch (error) {
        throw error
    }
}
export default mongoConnect;