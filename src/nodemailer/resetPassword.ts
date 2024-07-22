import fs from 'node:fs';
import path from 'node:path';
// @ts-ignore
import { sendMail } from '../../config/nodemailer';

interface params {
    email: string
    code: string
    name: string
}

export const resetPassword = ({ email, code, name }: params) => {
    const content = fs.readFileSync(path.resolve(__dirname, 'html', 'resetPassword.html'), 'utf-8').replace('{{ code }}', code).replace('{{ email }}', email).replace('{{ name }}', name);
    const options = {
        to: email,
        subject: "Redefinir senha | Progress Tracker",
        content
    };
    sendMail(options);
}