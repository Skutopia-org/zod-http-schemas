import { HttpSchema, Method } from './shared';
import { infer, ZodType, ZodTypeAny } from 'zod';

// TODO: ...
export type ExtractMethod<Route> = Route extends `${infer M} ${string}`
  ? M extends Method
    ? M
    : never
  : never;
export type ExtractPath<Route> = Route extends `${string} ${infer Path}`
  ? Path
  : never;

/** Extracts the union of string literal paths for the given schema and method. */
export type Paths<S extends HttpSchema, M extends Method> = FilterRoutes<
  S,
  M,
  string
>['path'];

/** Extracts the union of string literal named params for the given schema/method/path, or never if no params. */
export type NamedParams<
  S extends HttpSchema,
  M extends Method,
  P extends S[keyof S]['path']
> = FilterRoutes<S, M, P>['namedParams'] extends Array<infer U>
  ? Extract<U, string>
  : never;

/** Extracts the request body type for the given schema/method/path, or undefined if no body type specified. */
export type RequestBody<
  S extends HttpSchema,
  M extends Method,
  P extends S[keyof S]['path']
> = FilterRoutes<S, M, P>['requestBody'] extends infer U
  ? U extends ZodType<infer T>
    ? U['_output']
    : undefined
  : never;

export type RequestBodyInput<
  S extends HttpSchema,
  M extends Method,
  P extends S[keyof S]['path']
> = FilterRoutes<S, M, P>['requestBody'] extends infer U
  ? U extends ZodType<infer T>
    ? U['_input']
    : undefined
  : never;

/** Extracts the response body type for the given schema/method/path, or undefined if no body type specified. */
export type ResponseBody<
  S extends HttpSchema,
  M extends Method,
  P extends S[keyof S]['path']
> = FilterRoutes<S, M, P>['responseBody'] extends infer U
  ? U extends ZodType<infer T>
    ? U['_output']
    : undefined
  : never;

export type ResponseBodyInput<
  S extends HttpSchema,
  M extends Method,
  P extends S[keyof S]['path']
> = FilterRoutes<S, M, P>['responseBody'] extends infer U
  ? U extends ZodType<infer T>
    ? U['_input']
    : undefined
  : never;

/** Helper mapped type that selects the (should be single) RouteInfo matching the given method/path. */
export type FilterRoutes<
  S extends HttpSchema,
  M extends Method,
  P extends S[keyof S]['path']
> = S[keyof S] extends infer U
  ? U extends { method: M; path: P }
    ? U
    : never
  : never;

/** Helper type to simplify output type display. */
export type Anonymize<Obj> = Anonymize2<{ [K in keyof Obj]: Obj[K] }>;
type Anonymize2<T> = T;
