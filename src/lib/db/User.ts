import sequelize from './sequelize'
import { DataTypes, Model } from 'sequelize'
import ulid from '@/lib/ulid'
import userRoles from '@/lib/user.roles'

const attributes = {
    id: {
        type: DataTypes.STRING(26),
        primaryKey: true,
        defaultValue: ulid.generate,
        validate: {
            isValid: ulid.validator(),
        },
    },
    role: DataTypes.ENUM(
        userRoles.DISTRIBUTOR_ADMIN,
        userRoles.DISTRIBUTOR_USER,
        userRoles.DEALER_ADMIN,
        userRoles.DEALER_USER,
        userRoles.FRANCHISEE_ADMIN,
        userRoles.FRANCHISEE_USER,
    ),
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    middleName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}

const options = {
    sequelize,
    freezeTableName: true,
    tableName: 'user',
    timestamps: true,
}

class User extends Model {
    declare id: string
    declare role: string
    declare firstName: string
    declare middleName: string
    declare lastName: string
    declare username: string
    declare password: string
}

User.init(attributes, options)

export default User
