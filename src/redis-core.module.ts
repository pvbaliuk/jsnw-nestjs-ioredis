import {Global, Module, type DynamicModule, type FactoryProvider, type ValueProvider} from '@nestjs/common';
import Redis from 'ioredis';
import type {RedisRegisterOptions} from './redis.types';
import {REDIS_DEFAULT_LOCKS_HASH_KEY, REDIS_OPTIONS_TOKEN} from './redis.consts';
import {resolveKeyPrefix} from './redis.helpers';
import {RedisLockFactory} from './redis-lock.factory';

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
                RedisLockFactory
            ],
            exports: [
                redisProvider,
                RedisLockFactory
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
                locksHashKey: options.locksHashKey ?? REDIS_DEFAULT_LOCKS_HASH_KEY
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
            useFactory: (options: RedisRegisterOptions) => new Redis(options),
            inject: [REDIS_OPTIONS_TOKEN]
        };
    }

}
