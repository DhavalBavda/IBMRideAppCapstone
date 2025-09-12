import { v2 as cloudinary } from "cloudinary";
import Config from "./Config.js";

cloudinary.config({
  cloud_name: Config.CLOUDINARY_CLOUD_NAME,
  api_key: Config.CLOUDINARY_API_KEY,
  api_secret: Config.CLOUDINARY_API_SECRET,
});

export default cloudinary;
