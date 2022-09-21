/**
 * redis service
 */

import IOredis from 'ioredis';

const redis = new IOredis(process.env.REDIS_PORT ?? 6379, process.env.REDIS_HOST ?? 'localhost');

export { redis }
