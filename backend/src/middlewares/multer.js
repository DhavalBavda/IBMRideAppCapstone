import multer from "multer";

// Use memory storage → files are kept in RAM buffers
const storage = multer.memoryStorage();

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

// Helper for multiple fields
export const uploadMultiple = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "license", maxCount: 1 },
  { name: "aadhar", maxCount: 1 },
]);

export default upload;
