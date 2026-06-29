import 'dotenv/config';
import mongoose from 'mongoose';

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is not set. Copy .env.example to .env first.');
}

/**
 * Open the shared Mongoose connection. Callers (server, seed script) await this
 * before doing any work. Mongoose buffers model commands until connected, but
 * we connect explicitly so startup fails fast on a bad URI.
 */
export async function connectDb() {
  await mongoose.connect(process.env.MONGO_URI);
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export { mongoose };
