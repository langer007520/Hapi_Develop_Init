import Redlock from 'redlock'
import { redis } from '../redis_server'

export const redlock = new Redlock([redis], {
    driftFactor: 0.01,
    retryCount: 10,
    retryJitter: 200,
    automaticExtensionThreshold: 500
});

