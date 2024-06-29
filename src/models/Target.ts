import { DataTypes, Model, Optional } from "sequelize";
import { database } from "../database";

export interface Target {
    id: number;
    name: string;
    unit: string;
    value: number;
};

export interface TargetCreationAttributes extends Optional<Target, "id"> { };
export interface TargetInstance extends Model<Target, TargetCreationAttributes>, Target { };

export const Target = database.define<TargetInstance, Target>('Target', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    value: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
});