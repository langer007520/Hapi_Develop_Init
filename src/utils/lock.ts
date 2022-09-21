/**
 * 关于并发锁
 */
import { redis } from '../redis_server'

export class Lock {

    private key: string
    private timeout: number

    private constructor(key: string, timeout: number) {
        this.key = key
        this.timeout = timeout
    }

    private lock() {
        return redis.set(this.key, 1, "PX", this.timeout, "NX")
    }

    release() {
        return redis.del(this.key)
    }

    /**
     * 
     * @param keys 键
     * @param timeout 锁超时时间
     * @returns 
     */
    static async create(keys: string[] | string, timeout: number = 3000) {
        let keysSerial = keys instanceof Array ? keys.join(':') : keys;
        let myLock = new this(keysSerial, timeout);
        let result = await myLock.lock();
        console.log(result);

        if (result) {
            return myLock;
        } else {
            return null;
        }
    }



}