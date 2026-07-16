import timestring from 'timestring';
import type {RedisKeyConfigMap, RedisKeyFactoryMap, RedisKeyResolvable} from './redis-cache.types';

/**
 * @param {RedisKeyResolvable} keyLike
 * @param {string} [prefix]
 * @return {string}
 */
export const resolveRedisKey = (keyLike: RedisKeyResolvable, prefix?: string): string => {
    if(prefix && !prefix.endsWith(':'))
        prefix += ':';

    return (prefix ?? '') + (typeof keyLike === 'string' ? keyLike : keyLike.key);
}

/**
 * @template {RedisKeyConfigMap} T
 * @param {T} config
 * @param {string} prefix
 * @return {RedisKeyFactoryMap<T>}
 */
export const createRedisKeyFactory = <T extends RedisKeyConfigMap>(config: T, prefix?: string): RedisKeyFactoryMap<T> => {
    if(prefix && !prefix.endsWith(':'))
        prefix += ':';

    return Object.fromEntries(Object.entries(config).map(([k, v]) => {
        const ttlMsec = v.ttl ? timestring(v.ttl, 'ms') : undefined,
            ttlSec = ttlMsec !== undefined ? Math.round(ttlMsec / 1000) : undefined;

        return [
            k,
            (...args: any[]) => ({
                key: (prefix ?? '') + v.key(...args),
                ttl: ttlMsec !== undefined ? {asMillis: ttlMsec, asSeconds: ttlSec} : undefined,
                schema: v.schema
            })
        ];
    })) as unknown as RedisKeyFactoryMap<T>;
}
