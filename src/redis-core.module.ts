import Redis from 'ioredis';
import dedent from 'dedent';
import {Global, Module, type DynamicModule, type FactoryProvider, type ValueProvider} from '@nestjs/common';
import type {RedisRegisterOptions} from './redis.types';
import {REDIS_DEFAULT_CACHE_KEY_PREFIX, REDIS_DEFAULT_LOCKS_HASH_KEY, REDIS_OPTIONS_TOKEN} from './redis.consts';
import {resolveKeyPrefix} from './redis.helpers';
import {RedisLockFactory} from './redis-lock.factory';
import {RedisCacheService} from './redis-cache.service';

@Global()
@Module({})
export class RedisCoreModule{

    /**
     * @param {RedisRegisterOptions} options
     * @return {DynamicModule}
     */
    public static register(options: RedisRegisterOptions): DynamicModule{
        const optionsProvider = this.createOptionsProvider(options),
            redisProvider = this.createRedisProvider();

        return {
            module: RedisCoreModule,
            providers: [
                optionsProvider,
                redisProvider,
                RedisLockFactory,
                RedisCacheService
            ],
            exports: [
                redisProvider,
                RedisLockFactory,
                RedisCacheService
            ]
        };
    }

    /**
     * @param {RedisRegisterOptions} options
     * @return {ValueProvider}
     * @private
     */
    private static createOptionsProvider(options: RedisRegisterOptions): ValueProvider{
        return {
            provide: REDIS_OPTIONS_TOKEN,
            useValue: <RedisRegisterOptions>{
                ...options,
                keyPrefix: resolveKeyPrefix(options.keyPrefix),
                locksHashKey: options.locksHashKey ?? REDIS_DEFAULT_LOCKS_HASH_KEY,
                cacheKeyPrefix: options.cacheKeyPrefix ?? REDIS_DEFAULT_CACHE_KEY_PREFIX
            }
        };
    }

    /**
     * @return {FactoryProvider}
     * @private
     */
    private static createRedisProvider(): FactoryProvider{
        return {
            provide: Redis,
            useFactory: (options: RedisRegisterOptions) => RedisCoreModule.extendRedisWithCommands(new Redis(options)),
            inject: [REDIS_OPTIONS_TOKEN]
        };
    }

    /**
     * @param {Redis} redis
     * @return {Redis}
     * @private
     */
    private static extendRedisWithCommands(redis: Redis): Redis{
        redis.defineCommand('releaseLockAtomic', {
            numberOfKeys: 1,
            lua: dedent`
            if redis.call("hget", KEYS[1], ARGV[1]) == ARGV[2]
            then
                return redis.call("hdel", KEYS[1], ARGV[1])
            else
                return 0
            end
            `
        });

        redis.defineCommand('renewLockAtomic', {
            numberOfKeys: 1,
            lua: dedent`
            if redis.call("hget", KEYS[1], ARGV[1]) == ARGV[2]
            then
                redis.call("hexpire", KEYS[1], ARGV[3], "XX", "FIELDS", 1, ARGV[1])
                return 1
            else
                return 0
            end
            `
        });

        return redis;
    }

}
