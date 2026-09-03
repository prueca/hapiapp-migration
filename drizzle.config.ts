import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/lib/db/schema.ts',
    out: './drizzle',
    breakpoints: false,
    dbCredentials: {
        url: process.env.DB_URL!,
    },
})
