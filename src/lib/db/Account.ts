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
        type: DataTypes.TEXT,
    },
    phone: {
        type: DataTypes.STRING(32),
    },
    isrCode: {
        type: DataTypes.STRING(20),
        field: 'isr_code',
    },
    sapCode: {
        type: DataTypes.STRING(20),
        field: 'sap_code',
    },
    companyCode: {
        type: DataTypes.STRING(20),
        field: 'company_code',
    },
    type: {
        type: DataTypes.ENUM(
            accountTypes.DISTRIBUTOR,
            accountTypes.DEALER,
            accountTypes.FRANCHISEE,
        ),
        field: 'type',
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'active',
    },
    associateId: {
        type: DataTypes.STRING(26),
        field: 'associate_id',
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
    declare address: string | null
    declare phone: string | null
    declare isrCode: string | null
    declare sapCode: string | null
    declare companyCode: string | null
    declare status: string
    declare associateId: string | null
    declare parent?: Account
    declare children?: Account[]

    static associate(models: Json) {
        this.belongsTo(models.Account, {
            as: 'parent',
            foreignKey: 'associateId',
        })

        this.hasMany(models.Account, {
            as: 'children',
            foreignKey: 'associateId',
        })
    }
}

Account.init(attributes, options)

export default Account
