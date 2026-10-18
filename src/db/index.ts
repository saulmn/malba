import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString =
	process.env.DATABASE_URL_POOLED ||
	process.env.DATABASE_URL ||
	'';

if (!connectionString) {
	console.error('DATABASE_URL is not set in environment variables!');
}

const client = neon(connectionString);
export const db = drizzle(client, { schema });
