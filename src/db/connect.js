import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

let database;
let client;

const connectToDb = async (options = {}) => {
  if (database) {
    return database;
  }

  const connectionString = options.connectionString || process.env.MONGODB_URI;
  const databaseName = options.databaseName || process.env.MONGODB_DB_NAME || 'practice';

  if (!connectionString) {
    throw new Error('MONGODB_URI is required.');
  }

<<<<<<< HEAD
  client = new MongoClient(connectionString);
  await client.connect();
  database = client.db(databaseName);

  try {
    await mongoose.connect(connectionString, { dbName: databaseName });
  } catch (error) {
    await client.close();
    client = undefined;
    database = undefined;
    throw error;
  }

  return database;
=======
  await mongoose.connect(connectionString, { dbName: databaseName });

  try {
    client = new MongoClient(connectionString);
    await client.connect();
    database = client.db(databaseName);
    return database;
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
>>>>>>> f7542be798a600a14af51322d277711d047ddd5f
};

const getDb = () => {
  if (!database) {
    throw new Error('Database not initialized. Call connectToDb first.');
  }
  return database;
};

const closeDb = async () => {
<<<<<<< HEAD
  const closeClient = client?.close();
  client = undefined;
  database = undefined;
  await Promise.all([closeClient, mongoose.disconnect()]);
=======
  await mongoose.disconnect();

  if (client) {
    await client.close();
    client = undefined;
    database = undefined;
  }
>>>>>>> f7542be798a600a14af51322d277711d047ddd5f
};

export { closeDb, connectToDb, getDb };
