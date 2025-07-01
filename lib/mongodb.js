// Path: lib/mongodb.js

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Check if the connection is successful
clientPromise.then(() => console.log('Connected to MongoDB')).catch((err) => console.error('MongoDB Connection Error:', err));

export default clientPromise;


export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db('almanac');
  return { client, db };
}