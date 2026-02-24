import {Injectable, type OnApplicationShutdown} from '@nestjs/common';
import {type Redis} from 'ioredis';
import type {RedisForRootParams} from './redis.types';
import {getRedisToken} from './redis.helpers';
import {REDIS_DEFAULT_LOCKS_HASH_KEY} from './redis.consts';

@Injectable()
export class RedisInstancesManager implements OnApplicationShutdown{

    /**
     * @type {Map<string, Redis>}
     * @private
     */
    private readonly instances = new Map<string, Redis>();
    private readonly locksHashKeys = new Map<string, string>();

    public addInstance(resolvedToken: string, instance: Redis, locksHashKey: string): void;
    public addInstance(unresolvedToken: RedisForRootParams, instance: Redis, locksHashKey: string): void;
    /**
     * @param {string | RedisForRootParams} token
     * @param {Redis} instance
     * @param {string} locksHashKey
     */
    public addInstance(token: string|RedisForRootParams, instance: Redis, locksHashKey: string): void{
        token = typeof token === 'string' ? token : getRedisToken(token);
        if(this.instances.has(token))
            return;

        this.instances.set(token, instance);
        this.locksHashKeys.set(token, locksHashKey);
    }

    public getInstance(resolvedToken: string): Redis|null;
    public getInstance(unresolvedToken: RedisForRootParams): Redis|null;
    /**
     * @param {string | RedisForRootParams} token
     * @return {Redis | null}
     */
    public getInstance(token: string|RedisForRootParams): Redis|null{
        token = typeof token === 'string' ? token : getRedisToken(token);
        return this.instances.get(token) ?? null;
    }

    public hasInstance(resolvedToken: string): boolean;
    public hasInstance(unresolvedToken: RedisForRootParams): boolean;
    /**
     * @param {string | RedisForRootParams} token
     * @return {boolean}
     */
    public hasInstance(token: string|RedisForRootParams): boolean{
        token = typeof token === 'string' ? token : getRedisToken(token);
        return this.instances.has(token);
    }

    public getLocksHashKey(resolvedToken: string): string;
    public getLocksHashKey(unresolvedToken: RedisForRootParams): string;
    /**
     * @param {string | RedisForRootParams} token
     * @return {string}
     */
    public getLocksHashKey(token: string|RedisForRootParams): string{
        token = typeof token === 'string' ? token : getRedisToken(token);
        return this.locksHashKeys.get(token) ?? REDIS_DEFAULT_LOCKS_HASH_KEY;
    }

    /**
     * @return {Redis[]}
     */
    public getAllInstances(): Redis[]{
        return Array.from(this.instances.values());
    }

    /**
     * @return {Promise<void>}
     */
    public async onApplicationShutdown(): Promise<void>{
        await Promise.allSettled(
            this.getAllInstances()
                .map(instance => instance.quit())
        );
    }

}
