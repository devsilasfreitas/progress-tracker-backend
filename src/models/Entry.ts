import { DataTypes, Model, Optional } from "sequelize"
import { database } from "../database"

export interface Entry {
    id: number
    entryValue: number
    userId: number
    targetId: number
};

export interface EntryCreationAttributes extends Optional<Entry, "id"> {}
export interface EntryInstace extends Model<Entry, EntryCreationAttributes>, Entry {}

export const Entry = database.define<EntryInstace, Entry>('Entry', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    entryValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    targetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'targets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
});