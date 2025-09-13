import mailTranspoter from "../config/mailTranspoter.js";
import fs from 'fs/promises';
import path from "path";
import { fileURLToPath } from "url";
import config from "../config/Config.js";
// import firebaseadmin from '../config/firebaseMessage.js'
import cloudinary from "../config/cloudinary.js";

// recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
console.log(__filename);
const __dirname = path.dirname(__filename);
console.log(__dirname);

class HelperFunction {

    /**
     * Sends an email using a predefined HTML template.
     *
     * - Loads the HTML template file from `assets/email-templates/`.
     * - Replaces placeholders inside the template (`#key#`) with values from `templateData`.
     * - Uses Nodemailer transporter (`mailTranspoter`) to send the email.
     *
     * @async
     * @function sendMail
     * @param {Object} options - Email sending options
     * @param {string|string[]} options.to - Recipient(s) email address (array or string)
     * @param {string} [options.subject=''] - Email subject line
     * @param {string} [options.htmlTemplate=''] - Template file name (e.g. "welcome.html")
     * @param {Object} [options.templateData={}] - Key-value pairs to replace placeholders in the template
     * 
     * @returns {Promise<Object>} Nodemailer info object containing message details
     *
     * @throws {Error} If reading the template or sending the email fails
     *
     * @example
     * await sendMail({
     *   to: ["user@example.com"],
     *   subject: "Welcome to our app!",
     *   htmlTemplate: "welcome.html",
     *   templateData: { username: "John", link: "https://example.com/verify" }
     * });
    */
    async sendMail({ to = [], subject = '', htmlTemplate = '', templateData = {} }) {
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
                from: config.SMTP_USER,
                to: Array.isArray(to) ? to.join(',') : to,
                subject,
                html: htmlContent
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

    
    /**
     * Send an HTTP request to the Django / or any other App
     * @param {string} method - HTTP method (get, post, put, delete)
     * @param {string} url - API endpoint (relative to baseURL) "base url check in the .env file of the dir"
     * @param {object} [data={}] - Request body (ignored for GET/DELETE unless needed)
     * @param {object} [options={}] - Extra axios options (headers, params, etc.)
     */
    async axiosSendRequest(method, url, data = {}, options = {}){
        try {
            
            const config = {
                method,
                url,
                ...options
            }

            // based on the request method filtering is done for the data as only post, put and patch can have body
            if (["post", "put", "patch"].includes(method.toLowerCase())) {
                config.data = data;
            }
            // if not above methods then send data in the params 
            else {
                config.params = { ...(options.params || {}), ...data };
            }

            // call the api 
            const response = await httpClient.request(config);
            return response.data;

        } catch (error) {

            // The Api is returning a custom errors (catched when the status ! = 200)
            if (error.response) {
               throw { status: error.response.status, data: error.response.data };
            }
            // This means the request was sent, but the server didn’t respond at all.
            else if (error.request) {
                throw { message: "No response from server", error };
            }
            //This means Axios failed before even making the request.
            else {
                throw { message: error.message };
            }
        }
    }

    /**
     * Sends a push notification via Firebase Cloud Messaging (FCM).
     *
     * - Builds a multicast message with `notification` payload and target device tokens.
     * - Uses Firebase Admin SDK (`firebaseadmin.messaging()`) to send the notification.
     *
     * @async
     * @function sendFirebasePushNotification
     * @param {Object} messageObj - Notification payload (e.g., { title: "New Ride", body: "Your driver has arrived!" })
     * @param {string[]} deviceTokens - Array of device FCM tokens to send the notification to
     * 
     * @returns {Promise<Object>} Firebase response with success & failure counts for each token
     *
     * @throws {Error} If sending the notification fails
     *
     * @example
     * await HF.sendFirebasePushNotification(
     *   { title: "Ride Update", body: "Your driver is arriving soon" },
     *   ["token1", "token2"]
     * );
    */
    // async sendFirebasePushNotification(messageObj, deviceTokens) {
    //     try {
    //         if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
    //             throw new Error("No device tokens provided for push notification");
    //         }

    //         const message = {
    //             notification: { ...messageObj },
    //             tokens: deviceTokens,
    //         };

    //         const response = await firebaseadmin.messaging().sendEachForMulticast(message);

    //         console.log(`Push notification sent: ${response.successCount} success, ${response.failureCount} failures`);

    //         // log failed tokens for cleanup
    //         if (response.failureCount > 0) {
    //             response.responses.forEach((res, idx) => {
    //                 if (!res.success) {
    //                     console.error(`Failed token[${idx}]: ${deviceTokens[idx]} | Error:`, res.error?.message);
    //                 }
    //             });
    //         }

    //         return response;
    //     } catch (error) {
    //         console.error("Error sending push notification:", error.message);
    //         throw error;
    //     }
    // }


async uploadToCloudinary(file, folder) {
    if (!file || !file.buffer) {
      throw new Error("Invalid file object: buffer missing");
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `RideApp/${folder}` },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(file.buffer); // send buffer directly
    });
} }

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

export default new HelperFunction();
