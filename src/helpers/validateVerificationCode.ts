import { VerificationCode } from "../models";
import { UserInstance } from "../models/User";
import { VerificationCodeInstance } from "../models/VerificationCode";

export const validateVerificationCode = async (user: UserInstance, { code, service }: { code: string, service: VerificationCodeInstance['service'] }) => {
    const userVerificationCode = await VerificationCode.findOne({ where: { userId: user.id, service } });
    if (!userVerificationCode) throw new Error('Ocorreu um erro, tente novamente!');
    if (userVerificationCode.expiresAt < new Date()) throw new Error('Código expirado!');
    if (userVerificationCode.code !== code) return false;
    if (userVerificationCode.expiresAt > new Date() && userVerificationCode.code === code) {
        if (service === 'emailVerification') await user.update({ verified: true });
        await userVerificationCode.destroy();
        return true;
    }
    return false;
};