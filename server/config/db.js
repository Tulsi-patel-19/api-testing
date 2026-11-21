import mongoose from "mongoose";

async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.log("MongoDB connection failed:", err.message);
    }
}

function isMongoConnected() {
    return mongoose.connection.readyState === 1;
}

export default connectToDB;
export { isMongoConnected };
