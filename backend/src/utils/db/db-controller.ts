import type { Database } from "../../types/db-schema";
import pg from "pg";
// import * as pgTypes from 'pg-types'
const { Pool } = pg;
import { Kysely, PostgresDialect } from "kysely";
import "dotenv/config";

const int8TypeId = 20;
const numericTypeId = 1700;
const dateTypeId = 1082;
const boolTypeId = 16;

function parseBool(value) {
	return (
		value === "TRUE" ||
		value === "t" ||
		value === "true" ||
		value === "y" ||
		value === "yes" ||
		value === "on" ||
		value === "1"
	);
}

pg.types.setTypeParser(int8TypeId, (val) => {
	return Number.parseInt(val, 10);
});

pg.types.setTypeParser(numericTypeId, (val) => {
	return Number.parseFloat(val);
});

pg.types.setTypeParser(dateTypeId, (val) => {
	return new Date(val).toISOString().substring(0, 10);
});

pg.types.setTypeParser(boolTypeId, (val) => {
	return parseBool(val);
});

const dialect = new PostgresDialect({
	pool: new Pool({
		database: process.env.DATABASE_NAME,
		host: process.env.DATABASE_HOST,
		user: process.env.DATABASE_USER,
		port: Number.parseInt(process.env.DATABASE_PORT || "", 10),
		password: process.env.DATABASE_PASSWORD,
		max: 10,
	}),
});

export const db = new Kysely<Database>({
	dialect,
});
