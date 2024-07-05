import { Request, Response, NextFunction } from "express";
import { User } from "../models";
import jwt from "jsonwebtoken";
import { getAuthToken } from "../helpers/getAuthToken";

export async function checkToken (req: Request, res: Response, next: NextFunction) {
    try {
        console.log(req.url);
        const token = getAuthToken(req.headers);
        if (!token) {
            return res.status(401).json({ err: 'Acesso negado!' });
        }
        const { id } = jwt.decode(token) as { id: number };
        const user = await User.findByPk(id, { attributes: { exclude: ['password'] }});
        if (!user) {
            return res.status(401).json({ err: 'Acesso negado!' });
        }
        req.body.user = user;
        next();
    } catch (err: any) {
        return res.status(500).json({ err: err.message });
    }
}