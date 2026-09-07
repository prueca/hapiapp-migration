import {
    pgTable,
    varchar,
    pgEnum,
    boolean,
    unique,
    timestamp,
} from 'drizzle-orm/pg-core'
import ulid from '@/lib/ulid'
import accountTypes from '@/lib/account.types'
import userRoles from '@/lib/user.roles'

export const typeEnum = pgEnum('account_type', [
    accountTypes.DISTRIBUTOR,
    accountTypes.DEALER,
    accountTypes.HAPISTORE,
])

export const roleEnum = pgEnum('user_role', [
    userRoles.DISTRIBUTOR_ADMIN,
    userRoles.DISTRIBUTOR_USER,
    userRoles.DEALER_ADMIN,
    userRoles.DEALER_USER,
    userRoles.HAPISTORE_ADMIN,
    userRoles.HAPISTORE_USER,
])

export const account = pgTable('account', {
    id: varchar('id', { length: 26 }).primaryKey().$defaultFn(ulid.generate),

    type: typeEnum('type').notNull(),
    active: boolean('active').notNull().default(true),
    parentId: varchar('parent_id', { length: 26 }),

    name: varchar('name', { length: 255 }).notNull().unique(),
    address: varchar('address', { length: 255 }),
    phone: varchar('phone', { length: 32 }),
    isrCode: varchar('isr_code', { length: 20 }),
    sapCode: varchar('sap_code', { length: 20 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
})

export const user = pgTable('user', {
    id: varchar('id', { length: 26 }).primaryKey().$defaultFn(ulid.generate),

    role: roleEnum('role').notNull(),
    active: boolean('active').notNull().default(true),

    firstName: varchar('first_name', { length: 255 }).notNull(),
    middleName: varchar('middle_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    address: varchar('address', { length: 255 }),
    phone: varchar('phone', { length: 32 }),

    username: varchar('username', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
})

export const access = pgTable(
    'access',
    {
        id: varchar('id', { length: 26 })
            .primaryKey()
            .$defaultFn(ulid.generate),

        userId: varchar('user_id', { length: 26 })
            .references(() => user.id)
            .notNull(),

        accountId: varchar('account_id', { length: 26 })
            .references(() => account.id)
            .notNull(),

        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
        deletedAt: timestamp('deleted_at'),
    },
    (t) => [unique('access_user_account_unique').on(t.userId, t.accountId)],
)
