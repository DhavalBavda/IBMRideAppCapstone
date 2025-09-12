import nodemailer from 'nodemailer';
import config from './Config.js';

const mailTranspoter = nodemailer.createTransport({
    host : config.SMTP_HOST,
    port : config.SMTP_PORT,
    secure : true,
    auth: {
        user : config.SMTP_USER,
        pass : config.SMTP_PASS
    }
});
export default mailTranspoter;