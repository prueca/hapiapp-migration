import 'dotenv/config'
import _ from 'lodash'
import z from 'zod'
import { Op } from 'sequelize'
import path from 'path'

import db, { sequelize } from '@/lib/db'
import Logger from '@/lib/logger'
import read from '@/lib/source.reader'

const logger = new Logger('populate:access')

export default async () => {
    const source = path.join(__dirname, '../mock/user.csv')
    const forceSync = true
    const transaction = await sequelize.transaction()

    try {
        logger.print('Establishing database connection...')
        await sequelize.authenticate()

        logger.print('Creating table...')
        await db.Access.sync({ force: forceSync })

        const schema = z.object({
            userId: z.ulid(),
            accountId: z.ulid(),
        })

        /**
         * Populate table
         */

        const users = await read(source)

        let access = _.map(users, (item) => {
            let record: Json = {
                userId: item.id,
                accountId: item.account_id,
            }

            record = schema.parse(record)

            return record
        })

        await db.Access.bulkCreate(access, { transaction })
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
            transaction,
        })

        if (orphaned.length) {
            throw new Error(`Found ${orphaned.length} orphaned access`)
        }

        await transaction.commit()
    } catch (e: any) {
        await transaction.rollback()

        logger.print(e.message)
        logger.print(e.stack)
    }
}
