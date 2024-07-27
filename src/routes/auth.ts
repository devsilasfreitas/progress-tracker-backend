// @ts-nocheck

import express, { Request, Response } from "express";
import { User, UserTarget } from "../models";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { checkToken } from "./checkToken";
import { getAuthToken } from "../helpers/getAuthToken";
import multer from "multer";
import path from "path";
import { uploadFile } from "../../config/googledriveapi";
import fs from 'node:fs';
import { validateHeaderValue } from "http";
import { validateVerificationCode } from "../helpers/validateVerificationCode";
import { sendEmail } from "../nodemailer";
import { createVerificationCode } from "../helpers/createVerificationCode";
import { UserInstance } from "../models/User";
import { checkVerifiedEmail } from "./checkVerifiedEmail";
import { OAuth2Client } from "google-auth-library";
dotenv.config();

export const auth = express.Router();

const upload = multer({ dest: 'uploads/' });

auth.post('/signup', upload.single('profilePhoto'), async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (password !== confirmPassword) {
            return res.status(400).json({ err: 'As senhas não conferem' });
        }
        if (password.length < 8) {
            return res.status(400).json({ err: 'A senha deve ter pelo menos 8 caracteres' });
        }
        if (user && user.provider !== 'google') {
            return res.status(400).json({ err: 'Email ja existe' });
        }
        if (firstName.length < 2 || lastName.length < 2) {
            return res.status(400).json({ err: 'Nome muito curto. Insira pelo menos 2 letras' });
        }
        const newUser = user ?
            await user.update({
                firstName,
                lastName,
                email,
                password,
                provider: 'both',
                theme: 'light'
            }) :
            await User.create({
                firstName,
                lastName,
                email,
                password,
                provider: 'email',
                theme: 'light'
            });

        if (!newUser) return;


        if (req.file) {
            const filePath = path.resolve(__dirname, '..', '..', 'uploads', req.file.filename);
            const fileId = await uploadFile(filePath, `profile-${newUser.id}.png`).finally(() => fs.unlinkSync(filePath));
            const profileUrl = `https://drive.google.com/uc?id=${fileId}`;
            newUser.update({ profileUrl });
        }
        return res.status(201).json({ msg: "Usuário criado com sucesso", email: newUser.email });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error });
    }
});

auth.post("/signin", express.urlencoded({ extended: true }), async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ err: "Este email não existe" });
        }
        if (user.provider === 'google' && !user.password) return res.send(401).json({err: 'Acesse sua conta via google ou registre-se com seu email!'});
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ err: "Senha incorreta" });
        }
        const SECRET = process.env.SECRET_KEY as string;
        const token = jwt.sign({ id: user.id }, SECRET);
        if (user.verified) {
            return res.status(200).json({ token, msg: "Usuário logado com sucesso" });
        } else {
            return res.status(200).json({ token, err: "Verifique seu email para ativar sua conta" });
        }
    } catch (error: any) {
        console.log(error)
        res.status(500).json({ err: error.message });
    }
});

auth.get('/me/reset-password', async(req: Request, res: Response) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email }, attributes: { exclude: ['password'] } });
        if (!user) return res.status(400).json({ err: 'Email inexistente' });
        createVerificationCode(user, "resetPassword");
        return res.status(200).json({ msg: "Um email de redefinição de senha foi enviado para " + email });
    } catch (err: any) {
        return res.status(500).json({ err: err.message });
    }
});

auth.post('/me/reset-password', async (req: Request, res: Response) => {
    const { code, password, confirmPassword, email }: { code: string, email: string, password: string, confirmPassword: string } = req.body;
    try {
        const user = await User.findOne({ where: { email }, attributes: { exclude: ['password'] } });

        if (!user) return res.status(400).json({ err: 'Email inexistente' });

        const isValid = validateVerificationCode(user, { code, service: 'resetPassword'});
        if (await isValid) {
            if (password !== confirmPassword) return res.status(400).json({ err: 'As senhas não conferem' });
            if (password.length < 8) return res.status(400).json({ err: 'Senha muito curta. Insira pelo menos 8 letras' });
            await user.update({ password });
            return res.status(200).json({ msg: "Senha alterada com sucesso!" });
        } else {
            return res.status(400).json({ err: 'Código inválido' });
        }    
    } catch (err: any) {
        return res.status(500).json({ err: err.message });
    }    
});

// Rota de callback após autenticação bem-sucedida
auth.post('/google', async (req: Request, res: Response) => {
    const CLIENTID = process.env.OAUTH_CLIENTID;
    const client = new OAuth2Client(CLIENTID);
    const { token: tokenGoogle } = req.body;

    try {
        const response = await fetch("https://www.googleapis.com/userinfo/v2/me", {
            headers: {
                Authorization: `Bearer ${tokenGoogle}`
            }
        });

        const userOfGoogle = await response.json();

        const user = await User.findOne({ where: { email: userOfGoogle.email } });

        if (user) {
            const profileUrl = user.profileUrl === 'https://drive.google.com/uc?id=1h-wwIjZ0fFf-O-RAw0iX2Cup9l969p7l' ? userOfGoogle.picture : user.profileUrl;
            await user.update({ profileUrl, verified: true, provider: 'both' });
            const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY as string);
            return res.status(200).json({ token, user });
        } else {
            const names = {
                firstName: userOfGoogle.given_name || userOfGoogle.family_name.split(' ')[0],
                lastName: userOfGoogle.given_name ? userOfGoogle.family_name : userOfGoogle.slice(userOfGoogle.indexOf(' ') + 1, userOfGoogle.length - 1 - userOfGoogle.indexOf(' ')),
            }

            const newUser = await User.create({
                email: userOfGoogle.email,
                ...names,
                profileUrl: userOfGoogle.picture,
                verified: true,
                provider: 'google',
                theme: 'light'
            });
            const token = jwt.sign({ id: newUser.id }, process.env.SECRET_KEY as string);
            return res.status(200).json({ token, user: newUser });
        }
    } catch (err: any) {
        console.log(err)
        res.status(401).json({ err: err.message });
    }
});

auth.use(checkToken);

auth.get('/me/email-verification', (req: Request, res: Response) => {
    const { user } = req.body;

    if (user.verified) {
        return res.status(400).json({ err: 'Email ja verificado' });
    } else {
        try {
            createVerificationCode(user, "emailVerification");
            return res.status(200).json({ msg: "Um email de verificação foi enviado para " + user.email });
        } catch (err: any) {
            return res.status(500).json({ err: err.message });
        }
    }
});

auth.post('/me/email-verification', async (req: Request, res: Response) => {
    const { code, user }: { code: string, user: UserInstance } = req.body;
    try {
        const isValid = validateVerificationCode(user, { code, service: 'emailVerification'});
        if (await isValid) {
            return res.status(200).json({ msg: "Email verificado com sucesso" });
        } else {
            return res.status(400).json({ err: 'Código inválido' });
        }
    } catch (err: any) {
        return res.status(500).json({ err: err.message });
    }
});

auth.use(checkVerifiedEmail);

auth.get('/me', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const { id } = jwt.decode(token) as { id: number };
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(400).json({ err: 'Usuário inexistente' });
    res.status(200).json({ user });
});    

auth.put('/me/theme', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const { id } = jwt.decode(token) as { id: number };
    const { theme } = req.body;
    await User.update({ theme }, { where: { id } });
    res.status(200).json({ theme });
});    

auth.put('/me', upload.single('profilePhoto'), async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const { id } = jwt.decode(token) as { id: number };
    const { firstName, lastName, email } = req.body;

    if (firstName.length < 2 || lastName.length < 2) {
        return res.status(400).json({ err: 'Nome muito curto. Insira pelo menos 2 letras' });
    }    

    try {
        const user = await User.findByPk(id, { attributes: { exclude: ['password'] } } );
        if (!user) return res.status(400).json({ err: 'Usuário inexistente' });
        let fileId: string | null | undefined;
        if (req.file) {
            const filePath = path.resolve(__dirname, '..', '..', 'uploads', `profile-${id}.png`);
            fileId = await uploadFile(filePath, `profile-${user.id}.png`).finally(() => fs.unlinkSync(filePath));
        }    
        const profileUrl = `https://drive.google.com/uc?id=${fileId || '1h-wwIjZ0fFf-O-RAw0iX2Cup9l969p7l'}`;
        await user.update({ firstName, lastName, email, profileUrl }, { where: { id } });
        return res.status(200).json({ msg: 'Usuário editado com sucesso' });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }    
});    


auth.put('/me/password', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const { id } = jwt.decode(token) as { id: number };
    const { oldPassword, password }: { oldPassword: string, password: string } = req.body;
    try {
        const user = await User.findByPk(id);
        if (!user) return res.status(400).json({ err: 'Usuário inexistente' });
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ err: 'As senhas não conferem' });
        }
        if (password.length < 8) {
            return res.status(400).json({ err: 'A nova senha deve ter pelo menos 8 caracteres' });
        }
        await user.update({ password });
        res.status(200).json({ msg: 'Senha alterada com sucesso' });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
});

auth.delete('/me', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    const { password } = req.body;
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const { id } = jwt.decode(token) as { id: number };
    try {
        const user = await User.findByPk(id);
        if (!user) return res.status(400).json({ err: 'Usuário inexistente' });
        if (!password) return res.status(400).json({ err: 'Senha obrigatória' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ err: 'As senhas não conferem' });
        }
        await UserTarget.destroy({ where: { userId: id } });
        await User.destroy({ where: { id } });
        return res.status(200).json({ msg: 'Usuário deletado com sucesso' });
    } catch (err: any) {
        return res.status(500).json({ err: err.message });
    }
});