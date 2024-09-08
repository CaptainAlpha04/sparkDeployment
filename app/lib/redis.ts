// redis.ts
import { Redis } from '@upstash/redis'

const client = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export default client;
