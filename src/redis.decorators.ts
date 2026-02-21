import {Inject} from '@nestjs/common';
import {REDIS_DEFAULT_CONNECTION_NAME} from './redis.consts';
import {getRedisToken} from './redis.helpers';

/**
 * @param {string} [connectionName = REDIS_DEFAULT_CONNECTION_NAME]
 * @return {PropertyDecorator & ParameterDecorator}
 * @constructor
 */
export const InjectRedis = (connectionName: string = REDIS_DEFAULT_CONNECTION_NAME): PropertyDecorator & ParameterDecorator =>
    Inject(getRedisToken(connectionName));
