import * as pathToRegExp from 'path-to-regexp';
import {TypeFromTypeInfo, TypeInfo} from 'rtti';


/**
 * Accepts and returns an object that defines the shape of a HTTP API in terms of the routes it responds to, and the
 * shapes of the request/response payloads for each route. The given `schema` is validated and returned as-is.
 * HTTP schemas may be passed to `createHttpClient` and/or `decorateExpressServer` to implement the schema on the
 * client-side and/or server-side. See those functions for more details.
 */
export function httpSchema<T extends HttpSchema>(schema: T) {
    // Validate the schema for things we can check up-front.
    let methodPathCombos = new Set<string>();
    for (let route of schema) {

        // Ensure there are no duplicate method/path combinations.
        let methodPathCombo = `${route.method} ${route.path}`;
        if (methodPathCombos.has(methodPathCombo)) {
            throw new Error(`Duplicate method/path combination '${methodPathCombo}' in schema`);
        }
        methodPathCombos.add(methodPathCombo);

        // Ensure params parsed out of `path` exactly match the names in `route.params`.
        let pathParams = pathToRegExp.parse(route.path).filter(p => typeof p !== 'string') as pathToRegExp.Key[];
        let pathParamNames = pathParams.map(p => p.name);
        let routeParamNames = route.paramNames || [];
        let isParamsMismatch = pathParamNames.length !== routeParamNames.length;
        isParamsMismatch = isParamsMismatch || !pathParamNames.every(n => routeParamNames.includes(n as any));
        if (isParamsMismatch) {
            throw new Error(`Param names don't match in path and params for route '${route.method} ${route.path}'`);
        }
    }
    return schema;
}


/** Convenience function for defining a single route within a HTTP schema. */
export function httpRoute<
    M extends 'GET' | 'POST',
    P extends string,
    N extends string,
    T extends RouteInfo<M, P, N>
>(info: T & {[K in keyof T]: K extends keyof RouteInfo<any, any, any> ? T[K] : never}): T {
    return info;
}


/** A HTTP Schema, which is an array of `RouteInfo` items. */
export type HttpSchema = RouteInfo<'GET' | 'POST', string, string>[];


/** Runtime type information about a single HTTP route. */
export interface RouteInfo<M extends 'GET' | 'POST', P extends string, N extends string> {
    method: M;
    path: P;
    paramNames?: N[];
    requestPayload?: TypeInfo;
    responsePayload?: TypeInfo;
}


/** Extracts the union of string literal paths for the given schema and method. */
export type Paths<S extends HttpSchema, M extends 'GET' | 'POST'> = FilterRoutes<S, M, string>['path'];


/** Extracts the union of string literal param names for the given schema/method/path, or never if no params. */
export type ParamNames<S extends HttpSchema, M extends 'GET' | 'POST', P extends S[any]['path']>
    = FilterRoutes<S, M, P>['paramNames'] extends Array<infer U> ? Extract<U, string> : never;


/** Extracts the request payload type for the given schema/method/path, or undefined if no payload. */
export type RequestPayload<S extends HttpSchema, M extends 'GET' | 'POST', P extends S[any]['path']>
    = FilterRoutes<S, M, P>['requestPayload'] extends infer U
        ? U extends TypeInfo ? TypeFromTypeInfo<U> : undefined
        : never;


/** Extracts the response payload type for the given schema/method/path, or undefined if no payload. */
export type ResponsePayload<S extends HttpSchema, M extends 'GET' | 'POST', P extends S[any]['path']>
    = FilterRoutes<S, M, P>['responsePayload'] extends infer U
        ? U extends TypeInfo ? TypeFromTypeInfo<U> : undefined
        : never;


/** Helper mapped type that selects the (should be single) RouteInfo matching the given method/path. */
type FilterRoutes<S extends HttpSchema, M extends 'GET' | 'POST', P extends S[any]['path']>
    = S[any] extends infer U ? (U extends {method: M, path: P} ? U : never) : never;
