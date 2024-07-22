"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendMail = ({ to, subject, content }) => {
    const transporter = nodemailer_1.default.createTransport({
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
        },
        service: "gmail"
    });
    const mailOptions = {
        from: 'progresstrackerapplication@gmail.com',
        to,
        subject,
        html: content
    };
    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            throw new Error(err.message);
        }
        else {
            return data;
        }
    });
};
exports.sendMail = sendMail;
//# sourceMappingURL=nodemailer.js.map