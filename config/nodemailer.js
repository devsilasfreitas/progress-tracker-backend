"use strict";
require('dotenv').config();
console.log(process.env)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendMail = async ({ to, subject, content }) => {
    const transporter = nodemailer_1.default.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD
        }
    });
    const mailOptions = {
        from: process.env.MAIL_USERNAME,
        to,
        subject,
        html: content
    };
    await transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            console.error(err);
        }
        else {
            return data;
        }
    });
};
exports.sendMail = sendMail;
//# sourceMappingURL=nodemailer.js.map