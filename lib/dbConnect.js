const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'bargain';

let client;

async function getDB() {
  if (!client) {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB connected');
  }
  return client.db(dbName);
}

module.exports = { getDB };
