import _ from 'lodash'
import z from 'zod'
import { Op } from 'sequelize'

import db, { sequelize } from '@/lib/db'
import ulid from '@/lib/ulid'
import accountTypes from '@/lib/account.types'
import Logger from '@/lib/logger'

const FRESH = true
const SOURCE = '@/mock/accounts.json'

const logger = new Logger('populate:account')

export default async () => {
    const txn = await sequelize.transaction()

    try {
        logger.print('Establishing database connection...')
        await sequelize.authenticate()

        logger.print('Creating table...')
        await db.Account.sync({ force: FRESH })

        const schema = z
            .object({
                id: z.ulid(),
                type: z.enum([
                    accountTypes.DISTRIBUTOR,
                    accountTypes.DEALER,
                    accountTypes.FRANCHISEE,
                ]),
                name: z.string().nonempty(),
                address: z.string().nonempty(),
                phone: z.string().nonempty(),
                isrCode: z.string().nonempty(),
                sapCode: z.string().nonempty(),
                companyCode: z.string().nonempty(),
                associateId: z.ulid().or(z.null()),
            })
            .refine((data) => {
                if (data.type === accountTypes.DISTRIBUTOR) {
                    return data.associateId === null
                }

                return (
                    data.associateId !== null && ulid.isValid(data.associateId)
                )
            })

        /**
         * Populate table
         */

        const mock: PlainObject[] = (await import(SOURCE)).default

        let accounts: PlainObject[] = _.map(mock, (item) => {
            let record: PlainObject = _.pick(item, [
                'id',
                'type',
                'name',
                'address',
                'phone',
                'isr_code',
                'sap_code',
                'company_code',
                'associate_id',
            ])

            record = _.mapKeys(record, (v, k) => _.camelCase(k))
            record = schema.parse(record)

            return record
        })

        accounts = await db.Account.bulkCreate(accounts, { transaction: txn })
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
            transaction: txn,
            raw: true,
        })

        if (orphaned.length) {
            throw new Error(`Found ${orphaned.length} orphaned accounts`)
        }

        await txn.commit()
    } catch (e: any) {
        await txn.rollback()

        logger.print(e.message)
        logger.print(e.stack)
    }
}
