import 'dotenv/config'
import _ from 'lodash'
import z from 'zod'
import { Op } from 'sequelize'

import db, { sequelize } from '@/lib/db'
import Logger from '@/lib/logger'

const FRESH = true
const SOURCE = '@/mock/users.json'

const logger = new Logger('populate:access')

export default async () => {
    const txn = await sequelize.transaction()

    try {
        logger.print('Establishing database connection...')
        await sequelize.authenticate()

        logger.print('Creating table...')
        await db.Access.sync({ force: FRESH })

        const schema = z.object({
            userId: z.ulid(),
            accountId: z.ulid(),
        })

        /**
         * Populate table
         */

        const mock: PlainObject[] = (await import(SOURCE)).default

        let access = _.map(mock, (item) => {
            let record: PlainObject = {
                userId: item.id,
                accountId: item.account_id,
            }

            record = schema.parse(record)

            return record
        })

        await db.Access.bulkCreate(access, { transaction: txn })
        logger.print(`Inserted ${access.length} records.`)

        const orphaned = await db.Access.findAll({
            include: [
                {
                    model: db.User,
                    as: 'user',
                    required: false,
                },
                {
                    model: db.Account,
                    as: 'account',
                    required: false,
                },
            ],
            where: {
                [Op.or]: [{ '$user.id$': null }, { '$account.id$': null }],
            },
            transaction: txn,
        })

        if (orphaned.length) {
            throw new Error(`Found ${orphaned.length} orphaned access`)
        }

        await txn.commit()
    } catch (e: any) {
        await txn.rollback()

        logger.print(e.message)
        logger.print(e.stack)
    }
}
