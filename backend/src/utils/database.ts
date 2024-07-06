import { Database } from '../types/db-schema';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import "dotenv/config";

const dialect = new PostgresDialect({
  pool: new Pool({
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    port: process.env.DATABASE_PORT,
    password: process.env.DATABASE_PASSWORD,
    max: 10,
  })
})

export const db = new Kysely<Database>({
  dialect,
})