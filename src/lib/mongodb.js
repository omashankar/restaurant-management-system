import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not defined in .env");

const IS_BUILD_PHASE = process.env.npm_lifecycle_event === "build";
let clientPromise;

if (IS_BUILD_PHASE) {
  // Build-time fallback: avoid external DB dependency during static page generation.
  // This keeps `next build` stable in environments without DB access.
  const emptyCursor = {
    sort() {
      return this;
    },
    limit() {
      return this;
    },
    skip() {
      return this;
    },
    project() {
      return this;
    },
    toArray: async () => [],
  };

  const emptyCollection = {
    find: () => emptyCursor,
    findOne: async () => null,
    aggregate: () => emptyCursor,
    countDocuments: async () => 0,
    distinct: async () => [],
    insertOne: async () => ({ insertedId: null }),
    updateOne: async () => ({ matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }),
    replaceOne: async () => ({ matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }),
    deleteOne: async () => ({ deletedCount: 0 }),
    deleteMany: async () => ({ deletedCount: 0 }),
  };

  const buildClient = {
    db: () => ({
      collection: () => emptyCollection,
    }),
    close: async () => {},
  };

  clientPromise = Promise.resolve(buildClient);
} else {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    clientPromise = new MongoClient(uri).connect();
  }
}

export default clientPromise;
