import { getCache, setCache, getCacheStates, clearCache } from "../services/cache.services.js"
import TestHistory from "../model/testHistory.model.js";
import { isMongoConnected } from "../config/db.js";
import axios from "axios";


async function saveHistory(entry) {
    try {
        await TestHistory.create(entry);
    } catch (error) {
        console.log("failed to save history:", error.message);
    }
}
// GET   /api/health
export const getHealth = (req, res) => {
    res.json({
        success: true,
        server: true,
        mongo: isMongoConnected()
    });
};

// POST   /api/external
export const testExternalApi = async (req, res) => {

    // process.hrtime.bigint()-> node.js function, high-resolution timing in nenoseconds
    const startTime = process.hrtime.bigint();

    const url = req.externalUrl;
    const cachekey = `GET:${url}`;

    try {
        //check cache

        const cachedData = getCache(cachekey);

        //cache HIT
        if (cachedData !== null) {
            // endtime - start time /10e6  ns
            const responseTime = Number(process.hrtime.bigint() - startTime) / 1e6;
            // response time = time taken to return the result
            await saveHistory({
                apiurl: url,
                cachestatus: "HIT",
                responseTime,
                apicalled: false,
                success: true
            });

            return res.status(200).json({
                success: true,
                cachestatus: "HIT",
                responseTime,
                apicalled: false,
                data: cachedData
            });
        }

        // cache MISS
        // when cache miss call external api, using axios
        // axios wait up to 10 sec for req before time out
        try {
            const response = await axios.get(url, {
                timeout: 10000
            });

            // store response in cache 
            setCache(cachekey, response.data);

            const responseTime = Number(process.hrtime.bigint() - startTime) / 1e6;

            await saveHistory({
                apiurl: url,
                cachestatus: "MISS",
                responseTime,
                apicalled: true,
                success: true
            });

            return res.status(200).json({
                success: true,
                cachestatus: "MISS",
                responseTime,
                apicalled: true,
                data: response.data
            });

        } catch (error) {
            const responseTime = Number(process.hrtime.bigint() - startTime) / 1e6;

            await saveHistory({
                apiurl: url,
                cachestatus: "MISS",
                responseTime,
                apicalled: true,
                success: false,
                message: error.message
            });

            return res.status(200).json({
                success: false,
                cachestatus: "MISS",
                responseTime,
                apicalled: true,
                message: error.message
            });
        }
    } catch (error) {
        console.log("External test error :", error.message);

        return res.status(500).json({
            success: false,
            message: "External API request failed"
        });
    }
};

export const getcacheStates = (req, res) => {
    res.json({
        success: true,
        stats: getCacheStates()
    });
};


//delete  /api/cache
export const deleteCache = (req, res) => {

    clearCache();

    res.status(200).json({
        success: true,
        message: "Cache Cleared Successfully",
        stats: getCacheStates()
    });
};


// GET  /api/history
export const getTestHistory = async (req, res) => {

    try {

        const { cachestatus, limit } = req.query;
        const filter = {};

        if (cachestatus === "HIT" || cachestatus === "MISS") {
            filter.cachestatus = cachestatus;
        }

        let query = TestHistory.find(filter).sort({ createAt: -1 });

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
        console.error("History error :", error.message);

        res.status(500).json({
            success: true,
            message: "Failed to fetch API history"
        });
    }
};


// GET  /api/history/summary
export const getHistorySummary = async (req, res) => {
    try {
        const summary = await TestHistory.aggregate([
            {
                $group: {
                    _id: null,
                    totalTests: { $sum: 1 },
                    totalHits: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$cacheStatus", "HIT"]
                                },
                                1, 0
                            ]
                        }
                    },
                    totalMisses: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$cacheStatus", "MISS"]
                                },
                                1, 0
                            ]
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
        })
    } catch (error) {
        console.error("Summary error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to calculate summary"
        });
    }
}