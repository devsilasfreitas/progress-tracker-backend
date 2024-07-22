// @ts-nocheck

import express, { Request, Response } from "express";
import { Entry, User, UserTarget } from "../models";
import jwt from "jsonwebtoken";
import { getAuthToken } from "../helpers/getAuthToken";

const route = express.Router();

route.post('/:id/entries', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const { id } = jwt.decode(token) as { id: number };
    const targetId = req.params.id;
    const { entryValue } = req.body;
    try {
        const target = await UserTarget.findOne({ where: { userId: id, targetId: +targetId } });
        if (!target) return res.status(400).json({ err: 'Meta inexistente' });

        const entry = await Entry.create({ entryValue, userId: id, targetId: +targetId });
        res.status(200).json({ entry, msg: 'Meta criada com sucesso' });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
});

route.put('/:id/entries/:entryId', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const { id } = jwt.decode(token) as { id: number };
    const entryId = req.params.entryId;
    const { entryValue } = req.body;
    try {
        const entry = await Entry.findByPk(entryId, { include: { association: 'users' } });
        if (!entry) return res.status(400).json({ err: 'Meta inexistente' });
        if (entry.userId !== id || entry.users.find(user => user.id !== id)?.relation !== 'owner') return res.status(400).json({ err: 'Apenas o dono da meta ou o dono do registro pode editar o registro' });
        await Entry.update({ entryValue }, { where: { id: entryId } });
        return res.status(200).json({ entry, msg: 'Meta editada com sucesso' });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
});

route.delete('/:id/entries/:entryId', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const { id } = jwt.decode(token) as { id: number };
    const entryId = req.params.entryId;
    try {
        const entry = await Entry.findByPk(entryId, { include: { association: 'users' } });
        if (!entry) return res.status(400).json({ err: 'Registro inexistente' });
        if (entry.users.find(user => user.id !== id)?.relation !== 'owner' || entry.userId !== id) return res.status(400).json({ err: 'Apenas o dono da meta ou o dono do pode excluir o registro' });
        await Entry.destroy({ where: { id: entryId } });
        return res.status(200).json({ msg: 'Registro excluído com sucesso' });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
})

export { route as entries };