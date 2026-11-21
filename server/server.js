import express from "express";
import "dotenv/config";
import cors from "cors";
import axios from "axios";
import { getCache, setCache, getCacheStates, clearCache } from "./services/cache.services.js";
import TestHistory from "./model/testHistory.model.js";
import connectToDB, { isMongoConnected } from "./config/db.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
connectToDB();

function isValidHttpUrl(value) {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function getExternalErrorMessage(error) {
    if (error.code === "ECONNABORTED") {
        return "Request timed out after 10 seconds";
    }

    if (error.response) {
        return `External API returned status ${error.response.status}`;
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        return "Could not reach the external API";
    }

    return error.message || "External API request failed";
}

async function saveHistory(entry) {
    try {
        await TestHistory.create(entry);
    } catch (error) {
        console.error("Failed to save history:", error.message);
    }
}

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        server: true,
        mongo: isMongoConnected()
    });
});

app.post("/api/external", async (req, res) => {
    const startTime = process.hrtime.bigint();

    try {
        const url = typeof req.body.url === "string" ? req.body.url.trim() : "";

        if (!url) {
            return res.status(400).json({
                success: false,
                message: "Api URL is required"
            });
        }

        if (!isValidHttpUrl(url)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid http or https URL"
            });
        }

        const cacheKey = `GET:${url}`;
        const cachedData = getCache(cacheKey);

        if (cachedData !== null) {
            const responseTime = Number(process.hrtime.bigint() - startTime) / 1e6;

            await saveHistory({
                apiurl: url,
                cacheStatus: "HIT",
                responseTime,
                apiCalled: false,
                success: true
            });

            return res.status(200).json({
                success: true,
                cacheStatus: "HIT",
                responseTime,
                apicalled: false,
                data: cachedData
            });
        }

        try {
            const response = await axios.get(url, {
                timeout: 10000
            });

            setCache(cacheKey, response.data);

            const responseTime = Number(process.hrtime.bigint() - startTime) / 1e6;

            await saveHistory({
                apiurl: url,
                cacheStatus: "MISS",
                responseTime,
                apiCalled: true,
                success: true
            });

            return res.status(200).json({
                success: true,
                cacheStatus: "MISS",
                responseTime,
                apicalled: true,
                data: response.data
            });
        } catch (error) {
            const responseTime = Number(process.hrtime.bigint() - startTime) / 1e6;
            const message = getExternalErrorMessage(error);

            await saveHistory({
                apiurl: url,
                cacheStatus: "MISS",
                responseTime,
                apiCalled: true,
                success: false,
                errorMessage: message
            });

            return res.status(502).json({
                success: false,
                cacheStatus: "MISS",
                responseTime,
                apicalled: true,
                message
            });
        }
    } catch (error) {
        console.error("External test error:", error.message);
        res.status(500).json({
            success: false,
            message: "External API request failed"
        });
    }
});

app.get("/api/cache/stats", (req, res) => {
    res.json({
        success: true,
        stats: getCacheStates()
    });
});

app.delete("/api/cache", (req, res) => {
    clearCache();

    res.status(200).json({
        success: true,
        message: "Cache cleared successfully",
        stats: getCacheStates()
    });
});

app.get("/api/history", async (req, res) => {
    try {
        const { cacheStatus, limit } = req.query;
        const filter = {};

        if (cacheStatus === "HIT" || cacheStatus === "MISS") {
            filter.cacheStatus = cacheStatus;
        }

        let query = TestHistory.find(filter).sort({ createdAt: -1 });
        const parsedLimit = Number(limit);

        if (Number.isInteger(parsedLimit) && parsedLimit > 0) {
            query = query.limit(parsedLimit);
        }

        const history = await query;

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        console.error("History error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch API history"
        });
    }
});

app.get("/api/history/summary", async (req, res) => {
    try {
        const summary = await TestHistory.aggregate([
            {
                $group: {
                    _id: null,
                    totalTests: { $sum: 1 },
                    totalHits: {
                        $sum: {
                            $cond: [{ $eq: ["$cacheStatus", "HIT"] }, 1, 0]
                        }
                    },
                    totalMisses: {
                        $sum: {
                            $cond: [{ $eq: ["$cacheStatus", "MISS"] }, 1, 0]
                        }
                    },
                    averageResponseTime: {
                        $avg: "$responseTime"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalTests: 1,
                    totalHits: 1,
                    totalMisses: 1,
                    averageResponseTime: {
                        $round: ["$averageResponseTime", 2]
                    }
                }
            }
        ]);

        res.json({
            success: true,
            summary: summary[0] || {
                totalTests: 0,
                totalHits: 0,
                totalMisses: 0,
                averageResponseTime: 0
            }
        });
    } catch (error) {
        console.error("Summary error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to calculate summary"
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
