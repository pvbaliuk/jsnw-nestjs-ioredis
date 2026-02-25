import {randomUUID, type UUID} from 'node:crypto';
import {setTimeout} from 'node:timers/promises';
import {type Redis} from 'ioredis';
import dedent from 'dedent';
import {REDIS_DEFAULT_LOCK_ACQUIRE_RETRY_DELAY_MS, REDIS_DEFAULT_LOCKS_HASH_KEY} from './redis.consts';

export type RedisLockConstructorParams = {
    redis: Redis;
    name: string;
}

export type RedisLockWaitAcquireParams = {
    lockTTL: number;
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
     * @param {RedisLockConstructorParams} params
     * @protected
     */
    protected constructor(params: RedisLockConstructorParams) {
        this.redis = params.redis;
        this.name = params.name;
        this.locksHashKey = this.redis?.['__$__locksHashKey__'] ?? REDIS_DEFAULT_LOCKS_HASH_KEY;
        this.value = randomUUID();
    }

    /**
     * @param {RedisLockWaitAcquireParams} params
     * @return {Promise<boolean>}
     */
    public async waitAcquire(params: RedisLockWaitAcquireParams): Promise<boolean>{
        const startedAt: number = Date.now();
        while(true){
            const acquired = await this.acquire(params.lockTTL);
            if(acquired)
                return true;

            if(params.signal?.aborted)
                return false;

            let delayMs = REDIS_DEFAULT_LOCK_ACQUIRE_RETRY_DELAY_MS;

            if(params.waitTimeout !== undefined){
                const elapsed = Date.now() - startedAt,
                    timeLeft = params.waitTimeout - elapsed;

                if(timeLeft <= 0)
                    return false;

                delayMs = Math.max(1, Math.min(REDIS_DEFAULT_LOCK_ACQUIRE_RETRY_DELAY_MS, timeLeft));
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
     * @return {Promise<void>}
     */
    public async release(): Promise<void>{
        await this.redis.eval(dedent`
        if redis.call("hget", KEYS[1], ARGV[1]) == ARGV[2]
        then
            return redis.call("hdel", KEYS[1], ARGV[1])
        else
            return 0
        end
        `, 1, this.locksHashKey, this.name, this.value);
    }

}
