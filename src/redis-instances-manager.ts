import {Injectable, type OnApplicationShutdown} from '@nestjs/common';
import {type Redis} from 'ioredis';
import type {RedisForRootParams} from './redis.types';
import {getRedisToken} from './redis.helpers';

@Injectable()
export class RedisInstancesManager implements OnApplicationShutdown{

    /**
     * @type {Map<string, Redis>}
     * @private
     */
    private readonly instances = new Map<string, Redis>();

    public addInstance(resolvedToken: string, instance: Redis): void;
    public addInstance(unresolvedToken: RedisForRootParams, instance: Redis): void;
    /**
     * @param {string | RedisForRootParams} token
     * @param {Redis} instance
     */
    public addInstance(token: string|RedisForRootParams, instance: Redis): void{
        token = typeof token === 'string' ? token : getRedisToken(token);
        if(this.instances.has(token))
            return;

        this.instances.set(token, instance);
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
