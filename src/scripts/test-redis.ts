
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

async function testRedis() {
  const redisUrl = process.env.KV_URL || process.env.REDIS_URL;
  console.log('Attempting to connect to:', redisUrl ? 'URL provided (masked)' : 'localhost');
  
  const options: any = {
    lazyConnect: true,
    tls: redisUrl?.startsWith('rediss://') ? {} : undefined,
    connectTimeout: 5000,
    maxRetriesPerRequest: 1
  };

  const redis = redisUrl ? new Redis(redisUrl, options) : new Redis(options);

  try {
    console.log('Connecting...');
    await redis.connect();
    console.log('Connected!');
    
    const ping = await redis.ping();
    console.log('Ping response:', ping);
    
    await redis.set('test-key', 'Hello from Ease Admin');
    const val = await redis.get('test-key');
    console.log('Set/Get test:', val === 'Hello from Ease Admin' ? 'PASSED' : 'FAILED');
    
    await redis.quit();
    process.exit(0);
  } catch (err) {
    console.error('Redis Connection Failed:');
    console.error(err);
    process.exit(1);
  }
}

testRedis();
