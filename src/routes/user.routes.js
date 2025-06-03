import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1 // limit to one file for avatar
        },
        {
            name: "coverImage",
            maxCount: 1 // limit to one file for cover image
        }
    ]),
    registerUser);

export default router;