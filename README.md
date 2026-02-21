# @jsnw/nestjs-ioredis

NestJS module for integrating Redis using [ioredis](https://www.npmjs.com/package/ioredis) with support for multiple connections and dependency injection.

## Features

- 🚀 Easy integration with NestJS applications
- 🔌 Support for multiple named Redis connections
- 💉 Dependency injection with `@InjectRedis()` decorator
- 🔄 Automatic connection lifecycle management
- 🏷️ Key prefix support with automatic formatting
- 🛡️ TypeScript support with full type definitions

## Installation

```bash
npm i -s @jsnw/nestjs-ioredis ioredis
```

## Quick Start

### Basic Usage

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
      password: 'your-password',
      isDefault: true,
    }),
  ],
})
export class AppModule {}
```

### Inject Redis in Services

Use the `@InjectRedis()` decorator to inject Redis instances into your services:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@jsnw/nestjs-ioredis';
import type { Redis } from 'ioredis';

@Injectable()
export class UserService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async cacheUser(userId: string, userData: any): Promise<void> {
    await this.redis.set(`user:${userId}`, JSON.stringify(userData));
  }

  async getUser(userId: string): Promise<any> {
    const data = await this.redis.get(`user:${userId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

## Configuration

### RedisForRootParams

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `hostname` | `string` | Yes | - | Redis server hostname |
| `port` | `number` | Yes | - | Redis server port |
| `username` | `string` | Yes | - | Redis username |
| `password` | `string` | Yes | - | Redis password |
| `connectionName` | `string` | No | Auto-generated | Unique name for the connection |
| `db` | `number` | No | `0` | Redis database index |
| `keyPrefix` | `string` | No | `''` | Prefix for all keys (automatically adds ':' separator) |
| `connectionTimeout` | `number` | No | `10000` | Connection timeout in milliseconds |
| `lazy` | `boolean` | No | `false` | Enable lazy connection (connect on first command) |
| `isDefault` | `boolean` | No | `false` | Mark this connection as the default |

## Advanced Usage

### Multiple Named Connections

You can configure multiple Redis connections with different names:

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '@jsnw/nestjs-ioredis';

@Module({
  imports: [
    RedisModule.forRoot({
      connectionName: 'cache',
      hostname: 'cache.redis.local',
      port: 6379,
      username: 'default',
      password: 'cache-password',
      isDefault: true, // This is the default connection
    }),
    RedisModule.forRoot({
      connectionName: 'sessions',
      hostname: 'sessions.redis.local',
      port: 6379,
      username: 'default',
      password: 'sessions-password',
      db: 1,
    }),
  ],
})
export class AppModule {}
```

### Inject Named Connections

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@jsnw/nestjs-ioredis';
import type { Redis } from 'ioredis';

@Injectable()
export class AppService {
  constructor(
    @InjectRedis('cache') private readonly cacheRedis: Redis,
    @InjectRedis('sessions') private readonly sessionRedis: Redis,
    @InjectRedis() private readonly defaultRedis: Redis, // Uses default connection
  ) {}

  async cacheData(key: string, value: string): Promise<void> {
    await this.cacheRedis.set(key, value);
  }

  async saveSession(sessionId: string, data: any): Promise<void> {
    await this.sessionRedis.set(sessionId, JSON.stringify(data), 'EX', 3600);
  }
}
```

### Key Prefix

The `keyPrefix` option automatically adds a prefix to all keys with proper colon formatting:

```typescript
RedisModule.forRoot({
  hostname: 'localhost',
  port: 6379,
  username: 'default',
  password: 'password',
  keyPrefix: 'myapp', // Will become 'myapp:'
  isDefault: true,
})
```

Now when you use Redis commands:

```typescript
await redis.set('user:123', 'data'); // Actually stored as 'myapp:user:123'
```

### Lazy Connection

Enable lazy connection to defer the actual Redis connection until the first command:

```typescript
RedisModule.forRoot({
  hostname: 'localhost',
  port: 6379,
  username: 'default',
  password: 'password',
  lazy: true,
  isDefault: true,
})
```

## Automatic Cleanup

The module automatically closes all Redis connections when the NestJS application shuts down. No manual cleanup is required.

## API Reference

### `RedisModule`

#### `forRoot(params: RedisForRootParams): DynamicModule`

Configures the Redis module with the provided connection parameters.

### `@InjectRedis(connectionName?: string)`

Decorator for injecting Redis instances into your services. If no connection name is provided, the default connection will be injected.

### `RedisForRootParams`

TypeScript interface for configuring Redis connections. See [Configuration](#configuration) section for details.

## License

MIT

## Author

Pavlo Baliuk (jsnow0177@gmail.com)
