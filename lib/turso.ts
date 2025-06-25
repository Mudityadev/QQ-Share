import { createClient } from '@libsql/client';

export const turso = createClient({
  url: process.env.TURSO_DB_URL!,
  // You may need to add an authToken property here if your DB requires it
}); 