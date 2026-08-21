import { Sequelize } from 'sequelize'

const sequelize = new Sequelize(process.env.DB_URL as string, {
    dialect: 'postgres',
    define: {
        underscored: true,
    },
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
})

export default sequelize
