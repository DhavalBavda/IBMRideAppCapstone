import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const mailTranspoter = nodemailer.createTransport({
    host : process.env.SMTP_HOST,
    port : process.env.SMTP_PORT,
    secure : true,
    auth: {
        user : process.env.SMTP_USER,
        pass : process.env.SMTP_PASS
    }
});
export default mailTranspoter;