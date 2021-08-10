import {TypeFromTypeInfo, TypeInfo} from 'rtti';
import {HttpSchema} from './shared';


/** Extracts the union of string literal paths for the given schema and method. */
export type Paths<S extends HttpSchema, M extends 'GET' | 'POST' | 'PUT'> = FilterRoutes<S, M, string>['path'];


/** Extracts the union of string literal param names for the given schema/method/path, or never if no params. */
export type ParamNames<S extends HttpSchema, M extends 'GET' | 'POST' | 'PUT', P extends S[any]['path']>
    = FilterRoutes<S, M, P>['paramNames'] extends Array<infer U> ? Extract<U, string> : never;


/** Extracts the request body type for the given schema/method/path, or undefined if no body type specified. */
export type RequestBody<S extends HttpSchema, M extends 'GET' | 'POST' | 'PUT', P extends S[any]['path']>
    = FilterRoutes<S, M, P>['requestBody'] extends infer U
        ? U extends TypeInfo ? TypeFromTypeInfo<U> : undefined
        : never;


/** Extracts the response body type for the given schema/method/path, or undefined if no body type specified. */
export type ResponseBody<S extends HttpSchema, M extends 'GET' | 'POST' | 'PUT', P extends S[any]['path']>
    = FilterRoutes<S, M, P>['responseBody'] extends infer U
        ? U extends TypeInfo ? TypeFromTypeInfo<U> : undefined
        : never;


/** Helper mapped type that selects the (should be single) RouteInfo matching the given method/path. */
type FilterRoutes<S extends HttpSchema, M extends 'GET' | 'POST' | 'PUT', P extends S[any]['path']>
    = S[any] extends infer U ? (U extends {method: M, path: P} ? U : never) : never;
