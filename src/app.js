import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({                  // for allowing those url data which we want to allow and block others
    origin: process.env.CORS_ORIGIN,        //cors methods read it
    credentials: true
}))


//configurations:-
app.use(express.json({limit:"16kb"})) //for setting coming json data limit
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))       //jb kuch files data kkuch bhi aata hai we want k apn store kre usse aur koi bhi                                       bhi access kr ske usko apn usko public folder me store kra denge
app.use(cookieParser())


//routes:-
import userRouter from "./routes/user.routes.js";

//routes declaration
//app.get likhte hai jb routes aur sb controllers app me hi hote the but ab middleware use krke vhn hai routes ko lana pdega
app.use("/api/v1/users", userRouter);


export {app}