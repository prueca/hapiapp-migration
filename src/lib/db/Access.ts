import sequelize from './sequelize'
import { DataTypes, Model } from 'sequelize'
import ulid from '@/lib/ulid'
import User from './User'
import Account from './Account'

const attributes = {
    id: {
        type: DataTypes.STRING(26),
        primaryKey: true,
        defaultValue: ulid.generate,
        validate: {
            isValid: ulid.validator(),
        },
    },
    userId: {
        type: DataTypes.STRING(26),
        allowNull: true,
        defaultValue: null,
        validate: {
            isValid: ulid.validator(true),
        },
        unique: 'unique_access',
    },
    accountId: {
        type: DataTypes.STRING(26),
        allowNull: true,
        defaultValue: null,
        validate: {
            isValid: ulid.validator(true),
        },
        unique: 'unique_access',
    },
}

const options = {
    sequelize,
    freezeTableName: true,
    tableName: 'access',
    timestamps: true,
}

class Access extends Model {
    declare id: string
    declare userId: string
    declare accountId: string
    declare user?: User
    declare account?: Account

    static associate(models: Json) {
        this.belongsTo(models.User, {
            as: 'user',
            foreignKey: 'userId',
        })

        this.belongsTo(models.Account, {
            as: 'account',
            foreignKey: 'accountId',
        })
    }
}

Access.init(attributes, options)

export default Access
