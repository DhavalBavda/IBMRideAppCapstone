
import express from "express";
import cookieParser from "cookie-parser";
import  {errorHandler}  from "./middlewares/errorHandler.js";

const app = express();
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// Import All Routes
import userRoute from "./routes/userRoutes.js";

app.use("/user",userRoute); //User Routes

// global error handling
app.use(errorHandler);

export default app;