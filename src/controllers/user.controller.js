import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../models/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // STEPS TO REGISTER USER:-
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for image, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field response
    // check for user creation
    // return response

    const { username, email, fullname, password } = req.body;

    // THIS IS THE BEGINNER APPROACH TO CHECK EVERY CONDITIION WITH DIFFRENT IF ELSE BLOCKS
    // if(fullname===""){
    //     throw new ApiError(400, "Fullname is required");
    // }


    //THIS IS THE ADVANCED APPROACH TO CHECK EVERY CONDITION WITH A SINGLE IF BLOCK
    if(
        [fullname, email, username, password].some((field) => field?.trim()==="")
    ) {
        throw new ApiError(400, "All fiels are required");
    }

    const existedUser = await User.findOne({ //$or is used to check more field then one
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
        
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registring the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

});

const loginUser = asyncHandler(async (req,res) => {
    // req body s data le aao
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie
    // send response

    const {email, username, password} = req.body;

    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "invalid user credentials")
    }

    const {accessToken, refreshToken} =  await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )


})

const logoutUser = asyncHandler(async (req, res) => {
    // clear cookies
    // remove refresh token from db
    // send response
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
    
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken= jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token ")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, " refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(200, {accessToken, newrefreshToken}, "Access token refreshed successfully")
        )
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token") 
    }
})

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Old password is incorrect")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    // return the current user
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    // get user details from req.body
    // update user details in db
    // return response

    const {fullname, email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullname: fullname,
                email: email
            }
        },
        {
            new:true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User details updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    // get avatar from req.files
    // upload to cloudinary
    // update user avatar in db
    // return response

    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, user, "User avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    // get coverimage from req.files
    // upload to cloudinary
    // update user coverimage in db
    // return response

    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image")

    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, user, "User cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // get userId from req.params
    // find user by id
    // return user details

    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }


    //database s user pura loge fir aggregation pipeline lagaenge uski id k babses itni zarurat hai nhi
    //User.find({username})
    //direct hi aggregation pipeline lga skta hai apn

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber ",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount: {$size: "$subscribers"},
                subscribedToCount: {$size: "$subscribedTo"},
                isSubscribed:{
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullname: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    console.log(channel);
    
    if(!channel?.length){
        throw new ApiError(404, "Channel not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel profile fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    // get user id from req.user
    // find user by id
    // populate watchHistory with video details
    // return response

    const user = await User.aggregate([
        {
            $match: {
                //direct id is liye nhi li kyuki aggregate k under sidha pura code jata hai mongoose kaam nhi krta is liye apn isi use krenge
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:
            {
                from: "videos", // collection name
                localField: "watchHistory", // field in user collection
                foreignField: "_id", // field in video collection
                as: "watchHistory", // output field
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            //owner me sb kuch nhi chahiye user ka is liye iske andr hi
                            pipeline:[
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                //$arrayElemAt: ["$owner", 0] // owner is an array, so we need to get the first element
                                $first: "$owner" // owner is an array, so we need to get the first element
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0]?.watchHistory || [], "User watch history fetched successfully")
    )
})

export { 
    registerUser,
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};