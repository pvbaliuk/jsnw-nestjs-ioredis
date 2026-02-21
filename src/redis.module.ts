import {type DynamicModule, Module} from '@nestjs/common';
import type {RedisForRootParams} from './redis.types';
import {RedisCoreModule} from './redis-core.module';

@Module({})
export class RedisModule{

    /**
     * @param {RedisForRootParams} params
     * @return {DynamicModule}
     */
    public static forRoot(params: RedisForRootParams): DynamicModule{
        return {
            module: RedisModule,
            imports: [
                RedisCoreModule.forRoot(params)
            ]
        };
    }

}
