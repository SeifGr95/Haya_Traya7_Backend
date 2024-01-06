const express = require("express");
const router = express.Router();
const {
  getUserById,
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  getExternalProfileInfo,
  updateUserPassword,
  updateUserImage
} = require("../controllers/user.controller");
const verifyToken = require("../utils/verifToken");
//const imageUpload = require("../utils/uploadImage");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dnozudt2x",
  api_key: "956142484736458",
  api_secret: "Y7w8mstqLX4B-KScPuuPVotkKd0"
});

// Create a Cloudinary storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", // Specify the folder in Cloudinary where files will be stored
    allowed_formats: ["jpg", "jpeg", "png", "gif"] // Specify allowed file formats
  }
});

// Create a multer instance using Cloudinary storage
const imageUpload = multer({ storage: storage });

router.post("/register", imageUpload.single("profileImg"), registerUser);
router.post("/login", loginUser);
router.get("/profile/:userId", getExternalProfileInfo);
router.get("/details", verifyToken, getUserById);
router.put("/update", verifyToken, updateUser);
router.put("/update/password", updateUserPassword);
router.put("/update/image", imageUpload.single("profileImg"), updateUserImage);
router.delete("/permanent/delete", verifyToken, deleteUser);

module.exports = router;
