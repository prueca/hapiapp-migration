import _ from 'lodash'
import z from 'zod'
import { Op } from 'sequelize'
import { parse } from 'csv-parse'
import fs from 'node:fs'
import path from 'node:path'

import db, { sequelize } from '@/lib/db'
import ulid from '@/lib/ulid'
import accountTypes from '@/lib/account.types'
import Logger from '@/lib/logger'

const logger = new Logger('populate:account')

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
        status: z.enum(['active', 'inactive']),
        associateId: z.ulid().or(z.null()).or(z.string()),
    })
    .refine((data) => {
        if (data.type === accountTypes.DISTRIBUTOR) {
            return data.associateId === null || data.associateId === ''
        }

        return data.associateId !== null && ulid.isValid(data.associateId)
    })

const read = async (source: string) => {
    const ext = source.split('.').pop()
    let arr: Json[] = []

    switch (ext) {
        case 'csv':
            await new Promise((resolve, reject) => {
                fs.createReadStream(source)
                    .pipe(
                        parse({
                            columns: true,
                            skip_empty_lines: true,
                            bom: true,
                        }),
                    )
                    .on('end', () => resolve(arr))
                    .on('error', (error) => reject(error))
                    .on('data', (row) => {
                        const record = _.mapKeys(row, (v, k) => _.camelCase(k))
                        const { data, error } = schema.safeParse(record)

                        if (error) throw error

                        if (data.type === accountTypes.DISTRIBUTOR) {
                            data.associateId = null
                        }

                        arr.push(data)
                    })
            })
            break

        case 'json':
            arr = (await import(source)).default
            break
    }

    return arr
}

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
