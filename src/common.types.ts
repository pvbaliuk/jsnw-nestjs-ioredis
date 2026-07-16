export type Literal = string | number | boolean | bigint | null | undefined;

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

declare const tag: unique symbol;
export type Tagged<Token> = {
    readonly [tag]: Token;
}

export type Opaque<Type, Token = unknown> = Type & Tagged<Token>;
export type UnwrapOpaque<OpaqueType extends Tagged<unknown>> =
    OpaqueType extends Opaque<infer Type, OpaqueType[typeof tag]>
        ? Type
        : OpaqueType;


type OptionalKeys<T> = {
    [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

export type IfAllPropertiesOptional<T, TIf, TElse> = T extends Record<string, unknown>
    ? Exclude<keyof T, OptionalKeys<T>> extends never
        ? TIf
        : TElse
    : TElse;

type ExcludeKeysWithTypeOf<T, V> = {
    [K in keyof T]-?: [Exclude<T[K], undefined>] extends [V] ? never : K;
}[keyof T];

type ExcludeKeysWithoutTypeOf<T, V> = {
    [K in keyof T]-?: [Exclude<T[K], undefined>] extends [V] ? K : never;
}[keyof T];

export type With<T, V> = Pick<T, ExcludeKeysWithoutTypeOf<T, V>>;
export type Without<T, V> = Pick<T, ExcludeKeysWithTypeOf<T, V>>;
