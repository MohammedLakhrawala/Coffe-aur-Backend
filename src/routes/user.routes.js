import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

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

router.route("/login").post(loginUser)  

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken);

export default router;