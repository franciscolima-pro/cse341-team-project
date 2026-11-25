
import trips from './seeds/trips.json' with { type: 'json' };
import schedules from './seeds/schedules.json' with { type: 'json' };
import stations from './seeds/stations.json' with { type: 'json' };
import ticketClasses from './seeds/ticket-classes.json' with { type: 'json' };
import trains from './seeds/trains.json' with { type: 'json' };

const roles = [{ name: 'customer' }, { name: 'admin' }];

const starterCollections = [
  ['roles', roles],
  ['trips', trips],
  ['schedules', schedules.map((schedule) => {
    if (Array.isArray(schedule.months)) {
      return schedule;
    }

    const trip = trips.find((candidate) => candidate.id === schedule.tripId);
    return trip ? { ...schedule, months: trip.operatingMonths } : schedule;
  })],
  ['stations', stations],
  ['ticketClasses', ticketClasses],
  ['trains', trains]
];

const initializeDatabase = async (db) => {
  if (!db) {
    throw new Error('A database connection is required to initialize data.');
  }

  for (const [collectionName, documents] of starterCollections) {
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    await collection.insertMany(documents);
  }

  const existingCollections = await db.listCollections({}, { nameOnly: true }).toArray();
  const collectionNames = existingCollections.map((collection) => collection.name);

  if (collectionNames.includes('confirmations')) {
    if (!collectionNames.includes('bookings')) {
      await db.collection('confirmations').rename('bookings');
    } else {
      const confirmations = db.collection('confirmations');
      const bookings = db.collection('bookings');

      for await (const confirmation of confirmations.find({})) {
        await bookings.updateOne(
          { id: confirmation.id },
          { $setOnInsert: confirmation },
          { upsert: true }
        );
      }

      await confirmations.drop();
    }
  }

  await db.collection('bookings').createIndex({ id: 1 }, { unique: true });
};

export { initializeDatabase, starterCollections };
