import * as pathToRegExp from 'path-to-regexp';
import {RouteInfo} from './route-info';


/**
 * Accepts and returns an object that defines the shape of a HTTP API in terms of the routes it responds to, and the
 * shapes of the request/response bodies for each route. The given `schema` is validated and returned as-is.
 * HTTP schemas may be passed to `createHttpClient` and/or `decorateExpressServer` to implement the schema on the
 * client-side and/or server-side. See those functions for more details.
 */
export function createHttpSchema<T extends HttpSchema>(schema: T) {
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


/** A HTTP Schema, which is an array of `RouteInfo` items. */
export type HttpSchema = RouteInfo<'GET' | 'POST', string, string>[];
