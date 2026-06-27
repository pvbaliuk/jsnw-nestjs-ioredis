import {randomUUID, type UUID} from 'node:crypto';
import {setTimeout} from 'node:timers/promises';
import Redis from 'ioredis';
import {getRetryInterval} from './redis.helpers';

export type RedisLockWaitAcquireParams = {
    lockTTL: number;
    retryInterval?: number|number[]|((iteration: number) => number);
} & ({
    signal: AbortSignal;
    waitTimeout?: number;
} | {
    signal?: AbortSignal;
    waitTimeout: number;
})

export class RedisLock{

    private readonly redis: Redis;
    private readonly locksHashKey: string;
    public readonly name: string;
    private readonly value: UUID;

    private acquireLockPromise: Promise<boolean>|null = null;

    /**
     * @param {Redis} redis
     * @param {string} name
     * @param {string} locksHashKey
     * @protected
     */
    public constructor(redis: Redis, name: string, locksHashKey: string) {
        this.redis = redis;
        this.name = name;
        this.locksHashKey = locksHashKey;
        this.value = randomUUID();
    }

    /**
     * @param {RedisLockWaitAcquireParams} params
     * @return {Promise<boolean>}
     */
    public async waitAcquire(params: RedisLockWaitAcquireParams): Promise<boolean>{
        const startedAt: number = Date.now();

        let iteration: number = 0;
        while(true){
            const acquired = await this.acquire(params.lockTTL),
                RETRY_DELAY_MS = getRetryInterval(iteration, params.retryInterval);

            if(acquired)
                return true;

            if(params.signal?.aborted)
                return false;

            let delayMs = RETRY_DELAY_MS;
            if(params.waitTimeout !== undefined){
                const elapsed = Date.now() - startedAt,
                    timeLeft = params.waitTimeout - elapsed;

                if(timeLeft <= 0)
                    return false;

                delayMs = Math.max(1, Math.min(RETRY_DELAY_MS, timeLeft));
            }

            try{
                await setTimeout(delayMs, undefined, {signal: params.signal});
            }catch(e){
                if(e instanceof Error && e.name === 'AbortError')
                    return false;

                throw e;
            }
        }
    }

    /**
     * @param {number} ttlMs
     * @return {Promise<boolean>}
     */
    public acquire(ttlMs: number): Promise<boolean>{
        if(this.acquireLockPromise)
            return this.acquireLockPromise;

        this.acquireLockPromise = new Promise<boolean>((resolve, reject) => {
            this.redis.call('HSETEX', this.locksHashKey, 'FNX', 'PX', ttlMs, 'FIELDS', 1, this.name, this.value)
                .then(res => {
                    if(res === 1)
                        return resolve(true);

                    return resolve(false);
                })
                .catch(reject);
        });

        this.acquireLockPromise.finally(() => {
            this.acquireLockPromise = null;
        });

        return this.acquireLockPromise;
    }

    /**
     * @param {number} ttlSec
     * @return {Promise<boolean>}
     */
    public async renew(ttlSec: number): Promise<boolean>{
        const r = await this.redis.renewLockAtomic(this.locksHashKey, this.name, this.value, ttlSec);
        return r === 1;
    }

    /**
     * @return {Promise<void>}
     */
    public async release(): Promise<number>{
        return this.redis.releaseLockAtomic(this.locksHashKey, this.name, this.value);
    }

}
