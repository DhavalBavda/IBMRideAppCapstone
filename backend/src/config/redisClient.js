import Redis from 'ioredis';
import config from './Config.js';

const redis = new Redis({
  host: config.REDIS_HOST || 'localhost', 
  port: config.REDIS_PORT || 6379,  
  password: config.REDIS_PASSWORD || '',
  db: config.REDIS_DB || 0,
  retryStrategy: function(times) {
    // Retry strategy for reconnecting to Redis if the connection is lost
    if (times >= 3) {
      return undefined; // No more retries after 3 attempts
    }
    return Math.min(times * 50, 2000); // Retry after 50ms, then 100ms, then 200ms, etc.
  },
  connectTimeout: 10000, // Connection timeout in ms
  keepAlive: 30000,      // TCP keepalive time in ms
});

const checkRedisConnection = async () => {
    try {
        const result = await redis.ping();
        if(result){
            console.log('Redis connection successful:', result);
        }
    } catch (error) {
        console.error(error.message);
        throw error
    }
}

// const testFun = async () => {
//     try {
//         const result = await redis.geoadd('users:location', -122.4194, 37.7749, 'user1');

//         console.log(result);

//         const usergeo = await redis.geopos('users:location', 'user1');
//         console.log(usergeo);
        
//     } catch (error) {
//         console.error(error.message);
//         throw error;
//     }
// }

export default {checkRedisConnection, redis}
// export default {checkRedisConnection, redis, testFun}