import 'dotenv/config'
import _ from 'lodash'
import path from 'path'

import Logger from '@/lib/logger'
import read from '@/lib/source.reader'

import db from '@/lib/db'
import { eq, or, isNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import * as t from '@/lib/db/schema'

type Access = {
    userId: string
    accountId: string
}

const logger = new Logger('populate:access')

export default async () => {
    try {
        const source = path.join(__dirname, '../mock/user.csv')
        let records: Json[] = await read(source)

        records = await Promise.all(
            _.map(records, async (x) => {
                const record = {
                    userId: x.id,
                    accountId: x.account_id,
                }

                return record
            }),
        )

        logger.print('Populating access table...')

        await db.transaction(async (txn) => {
            await txn.insert(t.access).values(records as Access[])

            const account = alias(t.account, 'account')
            const user = alias(t.user, 'user')

            const orphans = await txn
                .select({ account, user })
                .from(t.access)
                .leftJoin(account, eq(t.access.accountId, account.id))
                .leftJoin(user, eq(t.access.userId, user.id))
                .where(or(isNull(account), isNull(user)))

            if (orphans.length) {
                throw new Error(`Found ${orphans.length} orphan records`)
            }
        })

        logger.print(`Inserted ${records.length} records`)
    } catch (e: any) {
        logger.print(e.message)
        logger.print(e.stack)
    }
}
