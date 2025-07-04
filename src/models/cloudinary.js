import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localfilepath) => {
    try{
        if(!localfilepath) {
            return null;
        }
        const response = await cloudinary.uploader.upload(localfilepath,{
            resource_type: "auto"
        })
        fs.unlink(localfilepath)
        //console.log("file uploaded on cloudinary", response.url);
        return response;
    } catch(error) {
        fs.unlinkSync(localfilepath); // delete the file from local storage if upload fails
        console.error("Error uploading file to Cloudinary: ", error);
        return null;
    }
}

export { uploadOnCloudinary };
