import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/temp"); // specify the directory to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // create a unique filename
  }
});

export const upload = multer({
  storage,
});