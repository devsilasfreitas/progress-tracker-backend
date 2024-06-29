import { Optional, Model, DataTypes } from "sequelize"
import { database } from "../database"

export interface VerificationCode {
    id: number
    code: string
    userId: number
    expiresAt: Date
    service: 'emailVerification' | 'resetPassword'
}

export interface VerificationCodeCreationAttributes extends Optional<VerificationCode, 'id'> {};

export interface VerificationCodeInstance extends Model<VerificationCode, VerificationCodeCreationAttributes>, VerificationCode { };

export const VerificationCode = database.define<VerificationCodeInstance, VerificationCode>('VerificationCodes', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    service: {
        type: DataTypes.ENUM('emailVerification', 'resetPassword'),
        allowNull: false,
    }
});