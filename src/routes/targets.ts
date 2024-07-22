// @ts-nocheck

import express, { Request, Response } from "express";
import { checkToken } from "./checkToken";
import jwt from "jsonwebtoken";
import { Entry, Target, User, UserTarget } from "../models";
import { UserInstance } from "../models/User";
import { entries } from "./entries";
import { getAuthToken } from "../helpers/getAuthToken";
import { Op } from "sequelize";

const route = express.Router();

route.get('/', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const { id } = jwt.decode(token) as {id: number};
    try {
        const userTargets = await UserTarget.findAll({ where: { userId: id } });
        const targetsId = userTargets.map(userTarget => userTarget.targetId);
        const targets = await Target.findAll({
            where: { id: { [Op.in]: targetsId } },
            include: [
                { association: 'users', attributes: { exclude: ['password'] } },
                { association: 'entries'}
            ]
        });

        const myTargets = targets.filter(target => (
            target.users.find(user => user.id === id).UserCollaboratorTargets.relation === 'owner'
        ));
        const targetCollaborators = targets.filter(target => (
            target.users.find(user => user.id === id).UserCollaboratorTargets.relation === 'collaborator'
        ));
        res.status(200).json({ myTargets, targetCollaborators });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
});

route.post('/', async (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || '';
    const { name, unit, value, collaboratorsEmail, initialValue } = req.body;
    const { id } = jwt.decode(token) as {id: number};
    try {
        const user = await User.findByPk(id);

        if (!user) return res.status(400).json({ err: 'Usuário inexistente' });

        const target = await Target.create({ name, unit, value });
        await UserTarget.create({ userId: id, targetId: target.id, relation: 'owner' });
        await Entry.create({ targetId: target.id, userId: id, entryValue: initialValue});
        let err: string = '';
        if (collaboratorsEmail) {
            collaboratorsEmail.map(async (userEmail: string) => {
                if (userEmail === user.email) err += 'O dono não pode ser um colaborador!\n';
                const collaborator = await User.findOne({ where: { email: userEmail } });
                if (collaborator) {
                    await UserTarget.create({ userId: collaborator.id, targetId: target.id, relation: 'collaborator' });
                } else {
                    err += `Nenhum usuário com email ${userEmail} encontrado!\n`;
                }
            });
        }

        res.status(200).json({ target, msg: 'Meta criada com sucesso', err: err && null });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
});

route.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const target = await Target.findByPk(id, { include: [{ association: 'entries'}, {association: 'users', attributes: {exclude: ['password']} }] });
        if (!target) return res.status(400).json({ err: 'Meta inexistente' });

        res.status(200).json({ target });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
});

route.put('/:id', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const {id: userId} = jwt.decode(token) as {id: number};
    const { name, unit, value } = req.body;
    const targetId = +req.params?.id;
    try {
        const userTarget = await UserTarget.findOne({ where: { userId, targetId } });
        if (userTarget?.relation !== 'owner') return res.status(400).json({ err: 'Acesso negado' });
        await Target.update({ name, unit, value }, { where: { id: targetId } });
        return res.status(200).json({ msg: 'Meta editada com sucesso' });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
});

route.delete('/:id', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const {id: userId} = jwt.decode(token) as {id: number};
    const targetId = +req.params?.id;
    try {
        const userTarget = await UserTarget.findOne({ where: { userId, targetId } });
        if (userTarget?.relation !== 'owner') return res.status(400).json({ err: 'Acesso negado' });
        await Target.destroy({ where: { id: targetId } });
        return res.status(200).json({ msg: 'Meta excluída com sucesso' });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
});

route.put('/:id/collaborators', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const {id: userId} = jwt.decode(token) as {id: number};
    const targetId = +req.params?.id;
    const { collaboratorsEmail }: { collaboratorsEmail: string[] } = req.body;
    try {
        const userTarget = await UserTarget.findOne({ where: { userId, targetId } });
        if (userTarget?.relation !== 'owner') return res.status(400).json({ err: 'Acesso negado' });

        let err: string = '';

        const user = await User.findByPk(userId, { attributes: { exclude: ['password'] }});

        if (!user) return res.status(400).json({ err: 'Acesso negado' });

        if (collaboratorsEmail) {
            const notFoundEmails: string[] = [];
            const userCollaborators = await User.findAll({ where: { email: { [Op.in]: collaboratorsEmail } }, attributes: {exclude: ['password']} });
            collaboratorsEmail.map(async (userEmail) => {
                if (userEmail === user.email) err += 'O dono da meta não pode ser um colaborador!\n'
                if (!userCollaborators.find(user => user.email === userEmail)) notFoundEmails.push(userEmail);
            });
            if (notFoundEmails.length > 0) err += `Nenhum usuário com os emails ${notFoundEmails.join(', ')} foi encontrado`;
            await UserTarget.destroy({ where: { userId: { [Op.notIn]: userCollaborators.map(user => user.id)}, relation: 'collaborator', targetId } });
            userCollaborators.map(async (user: UserInstance) => {
                await UserTarget.create({ userId: user.id, targetId, relation: 'collaborator' });
            })
        }

        return res.status(200).json({ msg: 'Colaboradores adicionados com sucesso' });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
});

route.delete('/:id/collaborators', async (req: Request, res: Response) => {
    const token = getAuthToken(req.headers);
    if (!token) return res.status(400).json({ err: 'Acesso negado' });
    const {id: userId} = jwt.decode(token) as {id: number};
    const targetId = +req.params?.id;
    try {
        const userTarget = await UserTarget.findOne({ where: { userId, targetId } });
        if (userTarget?.relation !== 'collaborator') return res.status(400).json({ err: 'O dono da meta não pode ser excluído' });
        await UserTarget.destroy({ where: { userId, targetId } });
        return res.status(200).json({ msg: 'Você não é mais colaborador desta meta' });
    } catch (err: any) {
        res.status(500).json({ err: err.message });
    }
});
route.use('/', entries);

export { route as targets };