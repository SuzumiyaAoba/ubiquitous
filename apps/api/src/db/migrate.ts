import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "dotenv/config";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5432/ubiquitous_language";

export async function runMigrations(): Promise<void> {
	console.log("Starting database migrations...");

	const migrationClient = postgres(connectionString, { max: 1 });
	const db = drizzle(migrationClient);

	try {
		await migrate(db, { migrationsFolder: "./src/db/migrations" });
		console.log("✓ All migrations completed successfully");
	} catch (error) {
		console.error("✗ Migration failed:", error);
		throw error;
	} finally {
		await migrationClient.end();
	}
}

// Run migrations if this file is executed directly
if (require.main === module) {
	runMigrations()
		.then(() => {
			console.log("Migration process completed");
			process.exit(0);
		})
		.catch((error) => {
			console.error("Migration process failed:", error);
			process.exit(1);
		});
}
