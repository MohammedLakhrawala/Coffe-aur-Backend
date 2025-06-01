// require('dotenv').config({path: './env'}); //not consistant


import dotenv from "dotenv";
import connectDB from "./db/index.js"

dotenv.config({
    path: './env'
})

connectDB();






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