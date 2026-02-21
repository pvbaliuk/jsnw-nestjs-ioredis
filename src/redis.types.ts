export type RedisForRootParams = {
    connectionName?: string;
    hostname: string;
    port: number;
    username: string;
    password: string;
    keyPrefix?: string;
    db?: number;
    connectionTimeout?: number;
    lazy?: boolean;
    isDefault?: boolean;
}
