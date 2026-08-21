import sequelize from './sequelize'
import { DataTypes, Model } from 'sequelize'
import ulid from '@/lib/ulid'
import accountTypes from '@/lib/account.types'

const attributes = {
    id: {
        type: DataTypes.STRING(26),
        primaryKey: true,
        defaultValue: ulid.generate,
        validate: {
            isValid: ulid.validator(),
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isrCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sapCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    companyCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    type: DataTypes.ENUM(
        accountTypes.DISTRIBUTOR,
        accountTypes.DEALER,
        accountTypes.FRANCHISEE,
    ),
    associateId: {
        type: DataTypes.STRING(26),
        allowNull: true,
        defaultValue: null,
        validate: {
            isValid: ulid.validator(true),
        },
    },
}

const options = {
    sequelize,
    freezeTableName: true,
    tableName: 'account',
    timestamps: true,
}

class Account extends Model {
    declare id: string
    declare type: string
    declare name: string
    declare address: string
    declare phone: string
    declare isrCode: string
    declare sapCode: string
    declare companyCode: string
    declare associateId: string

    static associate(models: PlainObject) {
        this.belongsTo(models.Account, {
            as: 'parent',
            foreignKey: 'associateId',
        })
    }
}

Account.init(attributes, options)

export default Account
