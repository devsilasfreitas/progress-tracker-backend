import { UserInstance } from "../models/User";
import { VerificationCodeInstance } from "../models/VerificationCode";
import { VerificationCode } from "../models";
import { sendEmail } from "../nodemailer";

const generateCode = () => {
    const listOfChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    let code = '';
    for (let i = 0; i <= 6; i++) {
        if (i === 3) {
            code += '-';
        } else {
            code += listOfChars[Math.floor(Math.random() * listOfChars.length)];
        }
    }
    return code;
}

export const createVerificationCode = async (user: UserInstance, service: VerificationCodeInstance['service']) => {
    try {
        console.log(user);
        const userVerificationCode = await VerificationCode.findOne({ where: { userId: user.id, service } });
        console.log('haha')
        const code = generateCode();

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
        if (userVerificationCode) {
            await userVerificationCode.update({ expiresAt, code });
        } else {
            await VerificationCode.create({ userId: user.id, code, expiresAt, service });
        }

        if (service === 'emailVerification') {
            sendEmail.emailVerification({ email: user.email, code, name: user.firstName });
        } else if (service === 'resetPassword') {
            sendEmail.resetPassword({ email: user.email, code, name: user.firstName });
        } else {
            throw new Error('Ocorreu um erro, tente novamente!');
        }
    } catch (err: any) {
        throw new Error(err.message);
    }
};