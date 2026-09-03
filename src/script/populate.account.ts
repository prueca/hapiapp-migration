import _ from 'lodash'
import z from 'zod'
import path from 'path'

import ulid from '@/lib/ulid'
import accountTypes from '@/lib/account.types'
import Logger from '@/lib/logger'
import read from '@/lib/source.reader'

import db from '@/lib/db'
import { eq, and, or } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import * as t from '@/lib/db/schema'

type Account = typeof t.account.$inferSelect

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
        parentId: z.ulid().or(z.null()).or(z.string()),
        active: z.boolean(),
    })
    .refine((data) => {
        if (data.type === accountTypes.DISTRIBUTOR) {
            return data.parentId === null || data.parentId === ''
        }

        return data.parentId !== null && ulid.isValid(data.parentId)
    })

export default async () => {
    const source = path.join(__dirname, '../mock/account.csv')

    try {
        let records: Json[] = await read(source)

        records = _.map(records, (x) => {
            x = _.mapKeys(x, (v, k) => _.camelCase(k))

            x.active = x.status === 'active'
            delete x.status

            const data = schema.parse(x)

            if (data.type === accountTypes.DISTRIBUTOR) {
                data.parentId = null
            }

            return data
        })

        // Mock data already has Ids, so we need to infer
        // the type of the records to match the database schema

        await db.transaction(async (txn) => {
            logger.print('Populating account table...')
            await txn.insert(t.account).values(records as Account[])

            // Check for any record that has parentId but
            // the parent record does not exist

            const parent = alias(t.account, 'parent')

            const orphans = await txn
                .select({ parent })
                .from(t.account)
                .leftJoin(parent, eq(t.account.parentId, parent.id))
                .where(
                    and(
                        eq(parent, null),
                        or(
                            eq(t.account.type, accountTypes.DEALER),
                            eq(t.account.type, accountTypes.HAPISTORE),
                        ),
                    ),
                )

            if (orphans.length) {
                throw new Error(`Found ${orphans.length} orphaned accounts`)
            }
        })

        logger.print(`Inserted ${records.length} records`)
    } catch (e: any) {
        logger.print(e.message)
        logger.print(e.stack)
    }
}
