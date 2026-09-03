import 'dotenv/config'
import _ from 'lodash'
import z from 'zod'
import * as argon2 from 'argon2'
import path from 'node:path'

import userRoles from '@/lib/user.roles'
import Logger from '@/lib/logger'
import read from '@/lib/source.reader'

import db from '@/lib/db'
import * as t from '@/lib/db/schema'

type User = typeof t.user.$inferSelect

const logger = new Logger('populate:user')

const schema = z.object({
    id: z.ulid(),
    role: z.enum([
        userRoles.DISTRIBUTOR_ADMIN,
        userRoles.DISTRIBUTOR_USER,
        userRoles.DEALER_ADMIN,
        userRoles.DEALER_USER,
        userRoles.HAPISTORE_ADMIN,
        userRoles.HAPISTORE_USER,
    ]),
    firstName: z.string().nonempty(),
    middleName: z.string().nonempty(),
    lastName: z.string().nonempty(),
    phone: z.string().nonempty(),
    username: z.string().nonempty(),
    password: z.string().nonempty(),
    address: z.string().nonempty(),
    active: z.boolean(),
})

export default async () => {
    try {
        const source = path.join(__dirname, '../mock/user.csv')
        let records: Json[] = await read(source)

        records = await Promise.all(
            _.map(records, async (x) => {
                x = _.mapKeys(x, (v, k) => _.camelCase(k))

                x.active = x.status == 'active'
                delete x.status

                const data = schema.parse(x)
                data.password = await argon2.hash(data.password)

                return data
            }),
        )

        logger.print('Populating user table...')

        await db.transaction(async (txn) => {
            await txn.insert(t.user).values(records as User[])
        })

        logger.print(`Inserted ${records.length} records`)
    } catch (e: any) {
        logger.print(e.message)
        logger.print(e.stack)
    }
}
