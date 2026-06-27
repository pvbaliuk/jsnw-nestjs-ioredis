import Redis, {Result, Callback} from 'ioredis';

declare module 'ioredis'{
    export interface RedisCommander<Context>{
        /**
         * Releases a distributed lock if the provided value matches the stored one.
         *
         * @param {string} locksHashKey - The Redis Hash key where locks are stored (KEYS[1]).
         * @param {string} lockName - The specific lock name / field inside the Hash (ARGV[1]).
         * @param {string} value - The unique value/token proving lock ownership (ARGV[2]).
         * @param {Callback<number>} [callback]
         * @returns {Promise<number>} A promise that resolves when the operation is complete. Returns 0 if no locks were released
         */
        releaseLockAtomic: (locksHashKey: string, lockName: string, value: string, callback?: Callback<number>) => Result<number, Context>;

        renewLockAtomic: (locksHashKey: string, lockName: string, value: string, ttlSec: number, callback?: Callback<0|1>) => Result<0 | 1, Context>;
    }
}
