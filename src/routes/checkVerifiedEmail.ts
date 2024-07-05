import { NextFunction, Request, Response } from "express";
import { getAuthToken } from "../helpers/getAuthToken";
import jwt from "jsonwebtoken";
import { User } from "../models";

export const checkVerifiedEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req.body;
    if (!user.verified) return res.status(400).json({ err: 'Email não verificado' });
    next();
}