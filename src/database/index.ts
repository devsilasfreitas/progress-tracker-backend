import { Sequelize } from "sequelize";

export const database = new Sequelize({
    dialect : 'postgres',
    host: process.env.DB_HOST,
    port: typeof parseInt(process.env.DB_PORT || "5432") === "number" ?  parseInt(process.env.DB_PORT || "5432") : 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    define: {
        underscored: true
    }
})