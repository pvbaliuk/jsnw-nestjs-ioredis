import {type DynamicModule, Module} from '@nestjs/common';
import type {RedisRegisterOptions} from './redis.types';
import {RedisCoreModule} from './redis-core.module';

@Module({})
export class RedisModule{

    /**
     * @param {RedisRegisterOptions} options
     * @return {DynamicModule}
     */
    public static register(options: RedisRegisterOptions): DynamicModule{
        return {
            module: RedisModule,
            imports: [
                RedisCoreModule.register(options)
            ]
        };
    }

}
