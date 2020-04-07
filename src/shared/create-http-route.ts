import {RouteInfo} from './route-info';


/** Convenience function for defining a single route within a HTTP schema. */
export function createHttpRoute<
    M extends 'GET' | 'POST',
    P extends string,
    N extends string,
    T extends RouteInfo<M, P, N>
>(info: T & {[K in keyof T]: K extends keyof RouteInfo<any, any, any> ? T[K] : never}): T {
    return info;
}
