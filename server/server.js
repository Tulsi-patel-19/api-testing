import express from "express";
import "dotenv/config";
import cors from "cors";
import axios from "axios";
import connectToDB, { isMongoConnected } from "./config/db.js";
import cacheRoutes from "./routes/cache.routes.js"

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

connectToDB();

app.use("/api",cacheRoutes);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
