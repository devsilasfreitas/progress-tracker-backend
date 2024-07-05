import { Request } from "express";

export const getAuthToken = (headers: Request['headers']) => {
    const authHeader = headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    return token;
}