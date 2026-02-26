# @jsnw/nestjs-ioredis

NestJS module for integrating Redis using [ioredis](https://www.npmjs.com/package/ioredis)

## Installation

```bash
npm i -s @jsnw/nestjs-ioredis ioredis @nestjs/common@11
```

## Quick Start

Import `RedisModule` in your app module and configure it with `forRoot()`:

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '@jsnw/nestjs-ioredis';

@Module({
  imports: [
    RedisModule.forRoot({
      hostname: 'localhost',
      port: 6379,
      username: 'default',
      password: 'your-password'
    }),
  ],
})
export class AppModule {}
```

## License

MIT

## Author

Pavlo Baliuk (jsnow0177@gmail.com)
