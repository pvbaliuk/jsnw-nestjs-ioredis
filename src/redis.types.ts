import {type RedisOptions} from 'ioredis';

export type RedisRegisterOptions = RedisOptions & {
    keyPrefix?: string;
    locksHashKey?: string;
}
