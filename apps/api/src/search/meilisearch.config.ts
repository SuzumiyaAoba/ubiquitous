export interface MeiliSearchConfig {
  host: string;
  apiKey: string;
}

export function validateMeiliSearchConfig(): MeiliSearchConfig {
  const host = process.env.MEILISEARCH_HOST;
  const apiKey = process.env.MEILISEARCH_API_KEY;

  if (!host) {
    throw new Error('MEILISEARCH_HOST environment variable is not set');
  }

  return {
    host,
    apiKey: apiKey || '',
  };
}

export const meiliSearchConfig = validateMeiliSearchConfig();
