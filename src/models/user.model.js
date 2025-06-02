import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    index: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
},
  fullname: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  avatar: { 
    type: String, // cloudinary url
    required: false
  },
  coverImage: { 
    type: String, 
  },
  watchHistory:[
    {
    type: Schema.Types.ObjectId,
    ref:"Video"
    }
  ],
  password:{
    type: String,
    required: [true, 'password is required']
  },
  refreshToken:{
    type:String
  }
},{timestamps: true});

//encryption vgera sb complex operations hai toh inko kaam krne me time lgta hai is liye y async funtion hai aur arrow function is callback me use nahi kr skte kyuki arrow function k pass this ka reference nahi hota but apn ko kis data pr kaam krna hai voh pta hona chahiye jesiki user ki koi field ko manipulate krna ho is liye normal function use kiya hai
userSchema.pre("save", async function(next){
    if(!this.isModified("password")){ return next(); } //if password is not modified, skip hashing
    this.password = bcrypt.hash(this.password, 10);
    next(); 
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);

//export default User;