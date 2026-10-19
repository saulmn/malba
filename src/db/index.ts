import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | null = null;

export function getDb(): DrizzleDb {
	if (!_db) {
		const connectionString =
			process.env.DATABASE_URL_POOLED ||
			process.env.DATABASE_URL ||
			'';

		if (!connectionString) {
			console.error('DATABASE_URL is not set in environment variables!');
			throw new Error(
				'DATABASE_URL no está configurada en las variables de entorno de Cloudflare. Por favor configúrala en Cloudflare Dashboard (Settings > Variables and Secrets).',
			);
		}

		const client = neon(connectionString);
		_db = drizzle(client, { schema });
	}
	return _db;
}

export const db = new Proxy({} as DrizzleDb, {
	get(_target, prop) {
		const instance = getDb();
		const value = Reflect.get(instance, prop, instance);
		if (typeof value === 'function') {
			return value.bind(instance);
		}
		return value;
	},
});

