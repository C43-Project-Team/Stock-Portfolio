import Redis from 'ioredis';
import "dotenv/config"

const redis = new Redis({
  host: process.env.REDIS_HOST, 
  port: Number.parseInt(process.env.REDIS_PORT),
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;
