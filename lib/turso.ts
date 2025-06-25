import { createClient } from '@libsql/client';

export const turso = createClient({
  url: 'libsql://qqstore-mudityadev.aws-ap-south-1.turso.io',
  // You may need to add an authToken property here if your DB requires it
}); 