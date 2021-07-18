import * as pathToRegExp from 'path-to-regexp';
import {t, TypeInfo} from 'rtti';
import {Method, methods} from './methods';
import {RouteInfo} from './route-info';

/**
 * Creates a HttpSchema object from the given route specifications.
 * HTTP schemas may be passed to `createHttpClient` and/or `decorateExpressServer` to implement the schema on the
 * client-side and/or server-side. See those functions for more details.
 */
export function createHttpSchema<RS extends RouteSpecs>(routeSpecs: RS): {[R in keyof RS]: ExtractRouteInfo<RS, R>} {
    // Extract and validate route info for each route specified in the schema.
    const schema: HttpSchema = {};
    let route: string;
    for (route in routeSpecs) {
        // Extract and validate the method and path.
        const parts = route.split(' ');
        if (parts.length !== 2) throw new Error(`Route must be specified using the format '{METHOD} {PATH}'`);
        const [method, path] = parts;
        if (!methods.includes(method as any)) throw new Error(`Unsupported method '${method}'. Expected one of: ${methods.join(', ')}`);

        // Extract the named params.
        // NB: pathToRegExp doesn't handle '*' wildcards like express, so we replace those with (.*) in the path.
        let pathParams = pathToRegExp.parse(path.replace(/\*/g, '(.*)')).filter(p => typeof p !== 'string') as pathToRegExp.Key[];
        if (pathParams.some(p => p.optional || p.repeat)) throw new Error(`Optional/repeated parameters are not supported`);
        let namedParams = pathParams.map(p => String(p.name));

        // Extract the req/res body shapes.
        const requestBody: TypeInfo = (routeSpecs as any)[route].requestBody ?? t.unknown;
        const responseBody: TypeInfo = (routeSpecs as any)[route].responseBody ?? t.unknown;

        schema[route] = {
            method: method as Method,
            path,
            namedParams,
            requestBody,
            responseBody,
        };
    }
    return schema as any;
}

/** Route specifications, given as an object keyed by route, with values describing the req/res body shape per route. */
export interface RouteSpecs {
    [route: `${Method} ${string}`]: {requestBody?: TypeInfo, responseBody?: TypeInfo}
}

/** A HTTP Schema declared as an object keyed by route, with values containing detailed information about each route. */
export interface HttpSchema {
    [route: string]: RouteInfo;
}

// Helper types to transform a HttpSchemaObj into 
type ExtractRouteInfo<Schema extends RouteSpecs, Route extends keyof Schema> = Anonymise<{
    method: ExtractMethod<Route>;
    path: ExtractPath<Route>;
    namedParams: Array<ExtractNamedParams<ExtractPath<Route>> | ExtractNumberedParams<ExtractPath<Route>>>;
    requestBody: Schema[Route] extends {requestBody: infer T} ? T : never;
    responseBody: Schema[Route] extends {responseBody: infer T} ? T : never;
}>;

type ExtractMethod<Route> = Route extends `${infer M} ${string}` ? M extends Method ? M : never : never;

type ExtractPath<Route> = Route extends `${string} ${infer Path}` ? Path : never;

type ExtractNamedParams<Path, Parts = Tail<Split<Path, ':'>>> = ExtractUntilDelim<Parts[any]>;

type ExtractUntilDelim<S>
    = S extends `${Delim}${string}` ? ''
    : S extends `${infer First}${infer Rest}` ? `${First}${ExtractUntilDelim<Rest>}`
    : '';

type Delim = '/' | ':' | '-' | '.' | '~' | '!' | '$' | '&' | "'" | '(' | ')' | '*' | '+' | ',' | ';' | '=' | '@' | '%';

type ExtractNumberedParams<Path, Parts = Split<Path, '/'>>
    = Filter<Parts, '*'> extends [...infer U] ? {[K in keyof U]: K}[any] : never;

// TODO: move to utils
type Anonymise<Obj> = Anonymise2<{[K in keyof Obj]: Obj[K]}>;
type Anonymise2<T> = T;

type Split<Str, Sep extends string>
    = Str extends `${infer First}${Sep}${infer Rest}` ? [First, ...Split<Rest, Sep>]
    : [Str];

type Tail<Tuple extends any[]> = Tuple extends [any, ...infer Rest] ? Rest : never;

type Filter<Tuple, U>
    = Tuple extends [infer First, ...infer Rest]
        ? First extends U ? [U, ...Filter<Rest, U>]
        : Filter<Rest, U>
    : [];
