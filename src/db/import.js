import dns from 'node:dns';



import { closeDb, connectToDb } from './connect.js';
import { initializeDatabase } from './initialize.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

try {
  const db = await connectToDb();
  await initializeDatabase(db);
  console.log('MongoDB import complete.');
} finally {
  await closeDb();
}
