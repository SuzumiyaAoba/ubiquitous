import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ubiquitous_language';

// Create postgres client
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 2,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

export async function closeConnection(): Promise<void> {
  await client.end();
  console.log('Database connection closed');
}

export async function testConnection(): Promise<boolean> {
  try {
    await client`SELECT NOW()`;
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
