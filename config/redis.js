// config/redis.js
import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Clever Cloud Redis configuration
const client = redis.createClient({
  url: process.env.REDIS_URL || process.env.REDISCLOUD_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    connectTimeout: 50000,
    lazyConnect: true
  }
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

export default client;