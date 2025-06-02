import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new mongoose.Schema({
  videofile: { 
    type: String, //cloudinary url
    required: true,
  },
    thumbnail: { 
        type: String, //cloudinary url
        required: true,
    },
    owner: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    title:{
        type:String,
        required: [true, 'title is required'],
    },
    description: {
        type: String,
        required: [true, 'description is required'],
    },
    duration: {
        type: Number, // in seconds & cloudinary duration
        required: true,
    },
    views:{
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true, // true for public video, false for private video
    },
},{timestamps: true});


videoSchema.plugin(mongooseAggregatePaginate);
const Video = mongoose.model("Video", videoSchema);

export default Video;
