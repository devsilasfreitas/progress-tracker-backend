import fs from 'node:fs';
import { sendMail } from '../../config/nodemailer';
import path from 'node:path';

interface params {
    email: string
    code: string
    name: string
}

export const emailVerification = async ({ email, code, name }: params) =>{
    const content = fs.readFileSync(path.resolve(__dirname, 'html', 'emailVerification.html'), 'utf8').replace('{{ code }}', code).replace('{{ email }}', email).replace('{{ name }}', name);
    const options = {
        to: email,
        subject: "Verificação de email | Progress Tracker",
        content
    };
    sendMail(options);
}