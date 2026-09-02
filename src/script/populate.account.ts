import _ from 'lodash'
import z from 'zod'
import { Op } from 'sequelize'
import path from 'node:path'

import db, { sequelize } from '@/lib/db'
import ulid from '@/lib/ulid'
import accountTypes from '@/lib/account.types'
import Logger from '@/lib/logger'
import read from '@/lib/source.reader'

const logger = new Logger('populate:account')

const schema = z
    .object({
        id: z.ulid(),
        type: z.enum([
            accountTypes.DISTRIBUTOR,
            accountTypes.DEALER,
            accountTypes.HAPISTORE,
        ]),
        name: z.string().nonempty(),
        address: z.string().nonempty(),
        phone: z.string().nonempty(),
        isrCode: z.string().nonempty(),
        sapCode: z.string().nonempty(),
        companyCode: z.string().nonempty(),
        associateId: z.ulid().or(z.null()).or(z.string()),
        active: z.boolean(),
    })
    .refine((data) => {
        if (data.type === accountTypes.DISTRIBUTOR) {
            return data.associateId === null || data.associateId === ''
        }

        return data.associateId !== null && ulid.isValid(data.associateId)
    })

export default async () => {
    const source = path.join(__dirname, '../mock/account.csv')
    const forceSync = true
    const transaction = await sequelize.transaction()

    try {
        logger.print('Establishing database connection...')
        await sequelize.authenticate()

        logger.print('Creating table...')
        await db.Account.sync({ force: forceSync })

        /**
         * Populate table
         */

        let accounts: Json[] = await read(source)

        accounts = _.map(accounts, (x) => {
            x = _.mapKeys(x, (v, k) => _.camelCase(k))

            x.active = x.status == 'active'
            delete x.status

            const data = schema.parse(x)

            if (data.type === accountTypes.DISTRIBUTOR) {
                data.associateId = null
            }

            return data
        })

        accounts = await db.Account.bulkCreate(accounts, { transaction })

        logger.print(`Inserted ${accounts.length} records.`)

        /**
         * Ensure parent record exists
         */

        const orphaned = await db.Account.findAll({
            include: 'parent',
            where: {
                associateId: { [Op.ne]: null },
                '$parent.id$': null,
            },
            transaction,
            raw: true,
        })

        if (orphaned.length) {
            throw new Error(`Found ${orphaned.length} orphaned accounts`)
        }

        await transaction.commit()
    } catch (e: any) {
        await transaction.rollback()

        logger.print(e.message)
        logger.print(e.stack)
    }
}
