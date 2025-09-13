import multer from "multer";
import path from "path";
import fs from "fs";

// Absolute path to backend/uploads
const uploadPath = path.join(process.cwd(), "backend", "uploads");

// Ensure uploads folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer storage: temporary local storage before uploading to Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${name}${ext}`);
  },
});

// File filter: only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Limits: file size
const limits = {
  fileSize: 2 * 1024 * 1024, // 2MB
};

// Export a reusable Multer instance
const upload = multer({ storage, fileFilter, limits });

// Helper for multiple files
export const uploadMultiple = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "license", maxCount: 1 },
  { name: "aadhar", maxCount: 1 },
]);

export default upload;
