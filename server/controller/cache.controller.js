import {getCache ,setCache } from "../services/cache.services.js"
import TestHistory from "../model/testHistory.model.js";
import { isMongoConnected } from "../config/db.js";
import axios from "axios";


async function saveHistory(entry){
    try{
        await TestHistory.create(entry);
    }catch(error){
        console.log("failed to save history:",error.message);
    }
}
// GET   /api/health
export const getHealth = (req,res)=>{
    res.json({
        success : true,
        server : true,
        mongo : isMongoConnected()
    });
};

// POST   /api/external
export const testExternalApi = async(req,res)=>{

    // process.hrtime.bigint()-> node.js function, high-resolution timing in nenoseconds
    const startTime = process.hrtime.bigint();

    const url = req.externalUrl;
    const cachekey = `GET:${url}`;

    try{
        //check cache

        const cachedData = getCache(cachekey);

        //cache HIT
        if(cachedData !== null){
            // endtime - start time /10e6  ns
            const responseTime = Number(process.hrtime.bigint() - startTime)/ 1e6;
            // response time = time taken to return the result
            await saveHistory({
                apiurl : url,
                cachestatus : "HIT",
                responseTime,
                apicalled :false,
                success : true
            });

            return res.status(200).json({
                success : true,
                cachestatus :"HIT",
                responseTime,
                apicalled:false,
                data:cachedData
            });
        }

        // cache MISS
        // when cache miss call external api, using axios
        // axios wait up to 10 sec for req before time out
        try{
            const response = await axios.get(url,{
                timeout:10000
            });

            // store response in cache 
            setCache(cachekey ,response.data);

            const responseTime = Number(process.hrtime.bigint() - startTime)/ 1e6;

            await saveHistory({
                apiurl : url,
                cachestatus : "MISS",
                responseTime,
                apicalled :true,
                success : true
            });

            return res.status(200).json({
                success : true,
                cachestatus :"MISS",
                responseTime,
                apicalled:true,
                data:response.data
            });

        }catch(error){
            const responseTime = Number(process.hrtime.bigint() - startTime) /1e6;

             await saveHistory({
                apiurl : url,
                cachestatus : "MISS",
                responseTime,
                apicalled :true,
                success : false,
                message : error.message
            });

            return res.status(200).json({
                success : false,
                cachestatus :"MISS",
                responseTime,
                apicalled:true,
                message : error.message
            });
        }
    }catch(error){
        console.log("External test error :",error.message);

        return res.status(500).json({
            success:false,
            message : "External API request failed"
        });
    }
};