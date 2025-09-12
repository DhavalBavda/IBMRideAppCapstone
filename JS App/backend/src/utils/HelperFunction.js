import mailTranspoter from "../config/mailTranspoter.js";
import fs from 'fs/promises';
import path from "path";
import { fileURLToPath } from "url";

// recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
console.log(__filename);
const __dirname = path.dirname(__filename);
console.log(__dirname);

export default class HelperFunction{

    async sendMail({to = [], subject = '', htmlTemplate = '', templateData = {}}){
        try {

            const templatePath = path.join(__dirname, "..", "assets", "email-templates", htmlTemplate);

            // Read HTML file
            let htmlContent = await fs.readFile(templatePath, "utf-8") || ``;

            // Replacing the placeholders (#key# → value)
            for (const [key, value] of Object.entries(templateData)) {
                const regex = new RegExp(`#${key}#`, "g"); 
                htmlContent = htmlContent.replace(regex, value);
            }

            // Mail options
            const mailOptions = {
                from : process.env.SMTP_USER,
                to : Array.isArray(to) ? to.join(',') : to,
                subject, 
                html : htmlContent
            }

            // send the mail here
            let info = await mailTranspoter.sendMail(mailOptions);
            console.log("Mail sent:", info.messageId);
            return info;

        } catch (error) {
            console.error("Error sending Mail: ", error.message);
            throw error;
        }
    }
}

// const HF = new HelperFunction()
// let mailObj = {
//     to : "djbavda@gmail.com",
//     subject : "Welcome to Ride App !",
//     htmlTemplate : 'welcome.html',
//     templateData : {
//         username : "user.username",
//         email : "user.email"
//     }
// }
// HF.sendMail(mailObj);