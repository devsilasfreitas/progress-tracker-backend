import { Sequelize } from "sequelize";

export const database = new Sequelize({
    dialect : 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'progress_tracker',
    password: "6022",
    database: 'progress_tracker_development',
    define: {
        underscored: true
    }
})