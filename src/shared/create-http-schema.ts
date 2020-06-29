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
        // NB: pathToRegExp doesn't handle '*' wildcards like express, so we replace those with (.*) in the path.
        let path = route.path.replace(/\*/g, '(.*)');
        let pathParams = pathToRegExp.parse(path).filter(p => typeof p !== 'string') as pathToRegExp.Key[];
        let actualParamNames = pathParams.map(p => String(p.name));
        let expectedParamNames = route.paramNames || [];
        let missingParamNames = expectedParamNames.filter(p => !actualParamNames.includes(p));
        let excessParamNames = actualParamNames.filter(p => !expectedParamNames.includes(p));
        if (missingParamNames.length > 0 || excessParamNames.length > 0) {
            let msg = `Param names don't match in path and params for route '${route.method} ${route.path}'.`;
            if (missingParamNames.length > 0) msg += ` Excess in paramNames: "${missingParamNames.join('", "')}".`;
            if (excessParamNames.length > 0) msg += ` Missing from paramNames: "${excessParamNames.join('", "')}".`;
            throw new Error(msg);
        }
    }
    return schema;
}


/** A HTTP Schema, which is an array of `RouteInfo` items. */
export type HttpSchema = RouteInfo<'GET' | 'POST', string, string>[];
