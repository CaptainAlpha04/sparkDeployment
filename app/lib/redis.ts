import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL 
});

client.on('error', (err) => console.error('Redis Client Error', err));

client.connect()
  .then(() => console.log('Connected to Redis'))
  .catch(err => console.error('Failed to connect to Redis', err));

export default client;
