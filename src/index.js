// require('dotenv').config({path: './env'}); //not consistant


import dotenv from "dotenv";
import connectDB from "./db/index.js"
import { app } from "./app.js";

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})







// 1st APPROACH OF CONNECTING DATABASE
// import express from "express"
// const app = express();

// //IFEE
// ;( async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) =>{
//             console.log("error: ", error)
//             throw error
//         })

//         app.listen(process.env.PORT, ()=>{
//             console.log(`app listing on port ${process.env.PORT}`)
//         })
//     } catch(error){
//         console.error("Error: ", error);
//     }
// })()