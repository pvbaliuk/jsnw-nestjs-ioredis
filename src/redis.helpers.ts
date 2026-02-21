import {RedisForRootParams} from './redis.types';
import {REDIS_INSTANCE_TOKEN_PREFIX} from './redis.consts';

export function resolveConnectionName(instanceName: string): string;
export function resolveConnectionName(params: RedisForRootParams): string;
/**
 * @param {string | RedisForRootParams} arg
 * @return {string}
 */
export function resolveConnectionName(arg: string|RedisForRootParams): string{
    if(typeof arg === 'string')
        return arg.toUpperCase();

    if(arg.connectionName && arg.connectionName.trim() !== '')
        return arg.connectionName.trim().toUpperCase();

    return `${arg.hostname}:${arg.port}/db${arg.db ?? 0}>${arg.keyPrefix ?? ''}`.toUpperCase();
}

export function getRedisToken(connectionName: string): string;
export function getRedisToken(params: RedisForRootParams): string;
/**
 * @param {string | RedisForRootParams} arg
 * @return {string}
 */
export function getRedisToken(arg: string|RedisForRootParams): string{
    if(typeof arg === 'string')
        return `${REDIS_INSTANCE_TOKEN_PREFIX}${arg}`.toUpperCase();

    return `${REDIS_INSTANCE_TOKEN_PREFIX}${resolveConnectionName(arg)}`.toUpperCase();
}

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
