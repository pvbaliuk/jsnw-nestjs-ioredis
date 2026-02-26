import {Inject, Injectable} from '@nestjs/common';
import Redis from 'ioredis';
import type {RedisRegisterOptions} from './redis.types';
import {REDIS_OPTIONS_TOKEN} from './redis.consts';
import {RedisLock} from './redis-lock';

@Injectable()
export class RedisLockFactory{

    /**
     * @param {RedisRegisterOptions} options
     * @param {Redis} redis
     */
    public constructor(
        @Inject(REDIS_OPTIONS_TOKEN)
        private readonly options: RedisRegisterOptions,
        private readonly redis: Redis
    ) {}

    /**
     * @param {string} name
     * @return {RedisLock}
     */
    public create(name: string): RedisLock{
        return new RedisLock(this.redis, name, this.options.locksHashKey!);
    }

}
