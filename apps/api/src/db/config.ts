export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'ubiquitous_language',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

export function validateDbConfig(): void {
  if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    throw new Error('Database configuration is missing. Please set DATABASE_URL or DB_* environment variables.');
  }
}
