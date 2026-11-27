import express from "express";
import { getHealth ,getHistorySummary,getTestHistory,testExternalApi ,deleteCache} from "../controller/cache.controller.js";
import isvalidHttpUrl from "../middleware/url.middleware.js"
import { getCacheStates } from "../services/cache.services.js";

const router = express.Router();

/**
 * GET /health
 * check server and database status
 * 
 */
router.get("/health",getHealth);

/**
 * POST /external
 * test an external API
 */
router.post("/external",isvalidHttpUrl,testExternalApi);

/**
 * GET /cache/stats
 * for get cache stats
 */
router.get("/cache/stats",getCacheStates);

/**
 * delete /cache
 * delete the cache 
 */
router.delete("/cache",deleteCache);

/**
 * route  GET /history /summary
 * to get history summary
 */
router.get("/history/summary",getHistorySummary);

/**
 * route GET /history
 * to get only history 
 */
router.get("/history",getTestHistory);


export default router;