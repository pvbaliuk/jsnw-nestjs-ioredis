import {type DynamicModule, type FactoryProvider, type Provider, Global, Module} from '@nestjs/common';
import {Redis} from 'ioredis';
import type {RedisForRootParams} from './redis.types';
import {RedisInstancesManager} from './redis-instances-manager';
import {REDIS_DEFAULT_CONNECTION_NAME, REDIS_LOCKS_HASH_KEY_PROP_NAME} from './redis.consts';
import {getRedisToken, resolveKeyPrefix} from './redis.helpers';

@Global()
@Module({
    providers: [
        RedisInstancesManager
    ]
})
export class RedisCoreModule{

    /**
     * @param {RedisForRootParams} params
     * @return {DynamicModule}
     */
    public static forRoot(params: RedisForRootParams): DynamicModule{
        const providers: Provider[] = [];
        const redisProvider = this.createRedisProvider(params);

        providers.push(redisProvider);
        if(!!params.isDefault)
            providers.push({
                provide: getRedisToken(REDIS_DEFAULT_CONNECTION_NAME),
                useExisting: getRedisToken(params)
            });

        return {
            module: RedisCoreModule,
            providers: providers,
            exports: providers
        };
    }

    /**
     * @param {RedisForRootParams} params
     * @return {FactoryProvider}
     * @private
     */
    private static createRedisProvider(params: RedisForRootParams): FactoryProvider{
        const redisToken = getRedisToken(params),
            keyPrefix = resolveKeyPrefix(params.keyPrefix);

        return {
            provide: redisToken,
            useFactory: (im: RedisInstancesManager) => {
                const existingInstance = im.getInstance(redisToken);
                if(existingInstance)
                    return existingInstance;

                const instance = new Redis({
                    host: params.hostname,
                    port: params.port,
                    username: params.username,
                    password: params.password,
                    db: params.db ?? 0,
                    connectTimeout: params.connectionTimeout ?? 10_000,
                    lazyConnect: !!params.lazy,
                    keyPrefix: keyPrefix
                });

                instance[REDIS_LOCKS_HASH_KEY_PROP_NAME] = params.locksHashKey;
                im.addInstance(redisToken, instance);
                return instance;
            },
            inject: [
                RedisInstancesManager
            ]
        };
    }

}
