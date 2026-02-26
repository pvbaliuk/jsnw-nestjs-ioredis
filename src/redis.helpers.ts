import {REDIS_DEFAULT_LOCK_ACQUIRE_RETRY_DELAY_MS} from './redis.consts';
import {type RedisLockWaitAcquireParams} from './redis-lock';

/**
 * @param {string} prefix
 * @return {string}
 */
export const resolveKeyPrefix = (prefix?: string): string => {
    if(!prefix)
        return '';

    prefix = prefix.trim();
    if(prefix.endsWith(':')){
        if(prefix.length === 1)
            return '';

        return prefix;
    }

    return prefix + ':';
}

/**
 * @param {number} iteration
 * @param {RedisLockWaitAcquireParams["retryInterval"]} [retryInterval]
 * @return {number}
 */
export const getRetryInterval = (iteration: number, retryInterval?: RedisLockWaitAcquireParams['retryInterval']): number => {
    if(retryInterval === undefined)
        return REDIS_DEFAULT_LOCK_ACQUIRE_RETRY_DELAY_MS;

    if(typeof retryInterval === 'number')
        return Math.max(1, retryInterval);

    if(Array.isArray(retryInterval)){
        if(retryInterval.length === 0)
            return REDIS_DEFAULT_LOCK_ACQUIRE_RETRY_DELAY_MS;

        if(retryInterval.length === 1)
            return retryInterval[0];

        return iteration < retryInterval.length
            ? retryInterval[iteration]
            : retryInterval[retryInterval.length - 1];
    }

    if(typeof retryInterval === 'function')
        return Math.max(1, retryInterval(iteration) ?? REDIS_DEFAULT_LOCK_ACQUIRE_RETRY_DELAY_MS);

    return REDIS_DEFAULT_LOCK_ACQUIRE_RETRY_DELAY_MS;
}
