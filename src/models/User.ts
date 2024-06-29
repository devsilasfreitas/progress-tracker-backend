import { DataTypes, Model, Optional } from "sequelize"
import { database } from "../database"
import bcrypt from "bcrypt";

export interface User {
    id: number
    firstName: string
    lastName: string
    email: string
    password?: string
    provider: 'google' | 'email' | 'both'
    theme: 'light' | 'dark',
    profileUrl?: string
    verified?: boolean
}

export interface UserCreationAttributes extends Optional<User, 'id'> { };
export interface UserInstance extends Model<User, UserCreationAttributes>, User {
    addTargets(targets: any): unknown;
};

export const User = database.define<UserInstance, User>('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: {
        type: DataTypes.CHAR(50),
        allowNull: false,
    },
    lastName: {
        type: DataTypes.CHAR(100),
        allowNull: false,
    },
    email: {
        type: DataTypes.CHAR(),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    provider: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    theme: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['light', 'dark']]
        }
    },
    profileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https://drive.google.com/uc?id=1h-wwIjZ0fFf-O-RAw0iX2Cup9l969p7l'
    },
    verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    hooks: {
        beforeSave: async (user) => {
            if (user.isNewRecord || user.changed('password')) {
                if (user.password) user.password = await bcrypt.hash(user.password, 10);
            }
        }
    }
})