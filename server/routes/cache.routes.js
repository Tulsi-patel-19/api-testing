import express from "express";
import { testExternalApi } from "../controller/cache.controller.js";
import isvalidHttpUrl from "../middleware/url.middleware.js"

const router = express.router();

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
router.post("/external",isvalidHttpUrl,testExternalApi)