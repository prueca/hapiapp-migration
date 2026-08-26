import 'dotenv/config'
import _ from 'lodash'
import z from 'zod'
import * as argon2 from 'argon2'
import path from 'node:path'

import db, { sequelize } from '@/lib/db'
import userRoles from '@/lib/user.roles'
import Logger from '@/lib/logger'
import read from '@/lib/source.reader'

const logger = new Logger('populate:user')

const schema = z.object({
    id: z.ulid(),
    role: z.enum([
        userRoles.DISTRIBUTOR_ADMIN,
        userRoles.DISTRIBUTOR_USER,
        userRoles.DEALER_ADMIN,
        userRoles.DEALER_USER,
        userRoles.FRANCHISEE_ADMIN,
        userRoles.FRANCHISEE_USER,
    ]),
    firstName: z.string().nonempty(),
    middleName: z.string().nonempty(),
    lastName: z.string().nonempty(),
    username: z.string().nonempty(),
    password: z.string().nonempty(),
})

export default async () => {
    const source = path.join(__dirname, '../mock/user.csv')
    const forceSync = true
    const txn = await sequelize.transaction()

    try {
        logger.print('Establishing database connection...')
        await sequelize.authenticate()

        logger.print('Creating table...')
        await db.User.sync({ force: forceSync })

        /**
         * Populate table
         */

        let users = await read(source)

        users = await Promise.all(
            _.map(users, async (x) => {
                x = _.mapKeys(x, (v, k) => _.camelCase(k))
                const { data, error } = schema.safeParse(x)

                if (error) throw error

                data.password = await argon2.hash(data.password)

                return data
            }),
        )

        await db.User.bulkCreate(users, { transaction: txn })
        logger.print(`Inserted ${users.length} records.`)

        await txn.commit()
    } catch (e: any) {
        await txn.rollback()

        logger.print(e.message)
        logger.print(e.stack)
    }
}
