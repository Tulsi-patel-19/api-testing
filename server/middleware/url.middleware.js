 const isvalidHttpUrl = (req,res,next) =>{

    const url = typeof req.body.url === "string" ? req.body.url.trim() :"";

    if(!url){
        return res.status(400).json({
            success : false,
            message : "Api url is required"
        });
    }
    try{
        const parsed = new URL(value);
        if( parsed.protocol !== "http:" && parsed.protocol !== "https:"){
            return res.status(400).json({
                success :false,
                message : "Enter a valid http or https URL"
            });
        }

        req.externalUrl = url;
        next();

    }catch{
        return res.status(400).json({
            success : false,
            message : "Enter a valid http or https URL"
        });
    }
};

export default isvalidHttpUrl;