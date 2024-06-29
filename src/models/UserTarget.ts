import { DataTypes, Model, Optional } from "sequelize"
import { database } from "../database"

export interface UserTarget {
    id: number
    userId: number
    targetId: number
    relation: string
}

export interface UserTargetCreationAttributes extends Optional<UserTarget, 'id'> {};
export interface UserTargetInstance extends Model<UserTarget, UserTargetCreationAttributes>, UserTarget {};

export const UserTarget = database.define<UserTargetInstance, UserTarget>('UserCollaboratorTargets', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    targetId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    relation: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['owner', 'collaborator']]
        }
    }
})