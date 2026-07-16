import Redis from 'ioredis';
import {Inject, Injectable} from '@nestjs/common';
import type {RedisRegisterOptions} from './redis.types';
import {REDIS_OPTIONS_TOKEN, REDIS_CACHE_EMPTY_HOLDER_KEY} from './redis.consts';
import type {
    RedisCacheInput,
    RedisCacheOutput,
    RedisKeyResolvable,
    RedisKeyResolved
} from './redis-cache.types';
import {resolveRedisKey} from './redis-cache.utils';

@Injectable()
export class RedisCacheService{

    public constructor(
        private readonly redis: Redis,
        @Inject(REDIS_OPTIONS_TOKEN)
        private readonly options: RedisRegisterOptions
    ) {}

    /**
     * @template {RedisKeyResolved} T
     * @param {T} key
     * @return {Promise<RedisCacheOutput<T["schema"]> | null>}
     */
    public async get<T extends RedisKeyResolved<any>>(key: T): Promise<RedisCacheOutput<T['schema']>|null>{
        const json = await this.redis.get(this.key(key));
        if(!json)
            return null;

        try{
            const parsedJSON = JSON.parse(json);
            return key.schema
                ? key.schema.parse(parsedJSON)
                : parsedJSON;
        }catch(e){
            void this.del(key);
        }

        return null;
    }

    /**
     * @template {RedisKeyResolved} T
     * @param {T} key
     * @param {RedisCacheInput<T["schema"]>} data
     * @return {Promise<boolean>}
     */
    public async set<T extends RedisKeyResolved<any>>(key: T, data: RedisCacheInput<T['schema']>): Promise<boolean>{
       const ttlMs = key.ttl ? key.ttl.asMillis : -1;
        try{
            const json = JSON.stringify(data);
            if(ttlMs >= 0){
                await this.redis.set(this.key(key), json, 'PX', ttlMs);
            }else{
                await this.redis.set(this.key(key), json);
            }

            return true;
        }catch(e){
            void this.del(key);
        }

        return false;
    }

    /**
     * @template {RedisKeyResolved} T
     * @param {T} key
     * @return {Promise<void>}
     */
    public async del<T extends RedisKeyResolved<any>>(key: T): Promise<boolean>{
        try{
            await this.redis.del(this.key(key));
            return true;
        }catch(e){}

        return false;
    }

    /**
     * @template {RedisKeyResolved} T
     * @param {T} key
     * @param {string} field
     * @return {Promise<RedisCacheOutput<T["schema"]> | null>}
     */
    public async hget<T extends RedisKeyResolved<any>>(key: T, field: string): Promise<RedisCacheOutput<T['schema']>|null>{
        const json = await this.redis.hget(this.key(key), field);
        if(!json)
            return null;

        try{
            const parsedJSON = JSON.parse(json);
            return key.schema
                ? key.schema.parse(parsedJSON)
                : parsedJSON;
        }catch(e){
            void this.del(key);
        }

        return null;
    }

    /**
     * @template {RedisKeyResolved} T
     * @param {T} key
     * @param {string[]} fields
     * @return {Promise<Record<string, RedisCacheOutput<T["schema"]>> | null>}
     */
    public async hmget<T extends RedisKeyResolved<any>>(key: T, fields: string[]): Promise<Record<string, RedisCacheOutput<T['schema']>>|null>{
        if(fields.length === 0)
            return {};

        const jsonItems = await this.redis.hmget(this.key(key), ...fields);
        if(jsonItems.length === 0)
            return null;

        const out: Record<string, RedisCacheOutput<T['schema']>> = {};
        try{
            for(let i = 0; i < fields.length; i++){
                const jsonStr = jsonItems[i];
                if(jsonStr === null)
                    continue;

                const parsedJSON = JSON.parse(jsonStr);
                out[fields[i]] = key.schema
                    ? key.schema.parse(parsedJSON)
                    : parsedJSON;
            }

            return out;
        }catch(e){
            void this.del(key);
        }

        return null;
    }

    /**
     * @template {RedisKeyResolved} T
     * @param {T} key
     * @return {Promise<Record<string, RedisCacheOutput<T["schema"]>> | null>}
     */
    public async hgetall<T extends RedisKeyResolved<any>>(key: T): Promise<Record<string, RedisCacheOutput<T['schema']>>|null>{
        const jsonItems = await this.redis.hgetall(this.key(key));
        const out: Record<string, RedisCacheOutput<T['schema']>> = {};

        try{
            for(const [k, v] of Object.entries(jsonItems)){
                if(k === REDIS_CACHE_EMPTY_HOLDER_KEY)
                    continue;

                const parsedJSON = JSON.parse(v);
                out[k] = key.schema
                    ? key.schema.parse(parsedJSON)
                    : parsedJSON;
            }

            return out;
        }catch(e){
            void this.del(key);
        }

        return null;
    }

    /**
     * @template {RedisKeyResolved} T
     * @param {T} key
     * @param {Record<string, RedisCacheInput<T["schema"]>>} items
     * @return {Promise<boolean>}
     */
    public async hset<T extends RedisKeyResolved<any>>(key: T, items: Record<string, RedisCacheInput<T['schema']>>): Promise<boolean>{
        const ttlMs = key.ttl ? key.ttl.asMillis : -1;
        const fields: string[] = [];
        let numfields: number = 0;

        try{
            for(const [k, v] of Object.entries(items)){
                fields.push(k, JSON.stringify(v));
                numfields++;
            }

            fields.push(REDIS_CACHE_EMPTY_HOLDER_KEY, Date.now().toString());
            numfields++;
        }catch(e){
            void this.del(key);
            return false;
        }

        try{
            if(ttlMs >= 0){
                await this.redis.hsetex(this.key(key), 'PX', ttlMs, 'FIELDS', numfields, ...fields);
            }else{
                await this.redis.hsetex(this.key(key), 'FIELDS', numfields, ...fields);
            }

            return true;
        }catch(e){
            void this.del(key);
        }

        return false;
    }

    /**
     * @template {RedisKeyResolved} T
     * @param {T} key
     * @param {string[]} fields
     * @return {Promise<boolean>}
     */
    public async hdel<T extends RedisKeyResolved<any>>(key: T, fields: string[]): Promise<boolean>{
        if(fields.length === 0)
            return;

        const keyStr = resolveRedisKey(key);
        try{
            await this.redis.hdel(keyStr, ...fields);
            return true;
        }catch(e){}

        return false;
    }

    /**
     * @param {RedisKeyResolvable} keyLike
     * @return {string}
     * @private
     */
    private key(keyLike: RedisKeyResolvable): string{
        return resolveRedisKey(keyLike, this.options.cacheKeyPrefix);
    }

}
