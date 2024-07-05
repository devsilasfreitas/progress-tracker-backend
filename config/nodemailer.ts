import nodemailer from 'nodemailer';

interface params {
    to: string,
    subject: string,
    content: string
}

export const sendMail = ({ to, subject, content }: params) => {
    const transporter = nodemailer.createTransport({
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
        } else {
            return data;
        }
    });
}