import {z} from 'zod';
import {type ReturnUnit} from 'timestring';
import {Prettify, Without} from './common.types';

export type RedisTTLString = `${number}${ReturnUnit}`;
export type RedisTTLResolved = {asMillis: number; asSeconds: number;};

export type RedisKeyConfig = {
    key: (...args: any[]) => string;
    ttl?: RedisTTLString;
    schema?: z.ZodSchema;
}

export type RedisKeyConfigMap = Record<string, RedisKeyConfig>;

export type RedisKeyResolved<T extends RedisKeyConfig> = Prettify<Without<{
    key: string;
    ttl: 'ttl' extends keyof T
        ? T['ttl'] extends RedisTTLString
            ? RedisTTLResolved
            : never
        : never;
    schema: 'schema' extends keyof T
        ? T['schema'] extends z.ZodSchema
            ? T['schema']
            : never
        : never;
}, never>>;

export type RedisKeyFactoryMap<T extends RedisKeyConfigMap> = {
    [K in keyof T]: (...args: Parameters<T[K]['key']>) => RedisKeyResolved<T[K]>;
};

export type RedisKeyResolvable = string | {key: string};

export type RedisCacheInput<T extends RedisKeyResolved<any>> = 'schema' extends keyof T
    ? T['schema'] extends z.ZodSchema
        ? z.input<T['schema']>
        : unknown
    : unknown;

export type RedisCacheOutput<T extends RedisKeyResolved<any>> = 'schema' extends keyof T
    ? T['schema'] extends z.ZodSchema
        ? z.output<T['schema']>
        : unknown
    : unknown;
