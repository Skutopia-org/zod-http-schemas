// NB: express imports will be elided in the built js code, since we are only importing types.
import * as express from 'express';
import {IRouter, RequestHandler as ExpressRequestHandler, ErrorRequestHandler} from 'express';
import {assert, removeExcessProperties, t, TypeFromTypeInfo, TypeInfo} from 'rtti';
import {HttpSchema} from '../shared';
import {Paths} from '../util';
import {RequestHandler} from './create-request-handler';


/** Options for decorateExpressRouter. */
export interface DecorateExpressRouterOptions<Schema extends HttpSchema, App extends IRouter, ReqProps extends TypeInfo> {

    /** Type schema describing the endpoints handled by the express server. */
    schema: Schema;

    /** Express app or router. Default value is `express.Router()`. */
    router?: App;

    /** TODO: doc... */
    requestProps?: ReqProps;

    /**
     * Optional request handler to delegate to if a server-side validation error occurs. If this option is not
     * specified, the default behaviour is to respond with a 400 status code.
     */
    onValidationError?: ErrorRequestHandler;
}


/**
 * Returns a decorated copy of the given express application or router, with strongly-typed `get`/`post` methods
 * and runtime validation checks on request/response bodies. The given app/router is not modified.
 */
export function decorateExpressRouter<
    Schema extends HttpSchema,
    App extends IRouter,
    ReqProps extends TypeInfo = t.object
>(options: DecorateExpressRouterOptions<Schema, App, ReqProps>) {

    // Return a new app/router with some overridden methods. The original app/router is left unchanged.
    let router = options.router ?? express.Router();
    let result: ExpressRequestHandler = (req, res, next) => router(req, res, next);
    Object.assign(result, {
        ...options.router,
        get: (path: string, ...handlers: ExpressRequestHandler[]) => handle('GET', path, ...handlers),
        post: (path: string, ...handlers: ExpressRequestHandler[]) => handle('POST', path, ...handlers),
    });
    return result as unknown as DecoratedExpressRouter<Schema, App, ReqProps>;

    // This function wraps express' normal get/post methods, adding runtime checks for schema conformance.
    function handle(method: 'GET' | 'POST', path: string, ...handlers: ExpressRequestHandler[]) {

        // Get the route info from the schema for this method/path.
        let matchingRoutes = options.schema.filter(r => r.method === method && r.path === path);
        let routeInfo = matchingRoutes[0];
        if (matchingRoutes.length !== 1) {
            const problem = matchingRoutes.length > 1 ? 'multiple routes' : 'no route';
            throw new Error(`Schema has ${problem} for method '${method}' and path '${path}'`);
        }

        // Elements of `handlers` can actually be arrays, so flatten the `handlers` array before proceeding.
        handlers = flatDeep(handlers);

        // Wrap each handler to ensure that if it throws or rejects, then it calls `next` with the error.
        // This ensures that *all* unhandled errors in route handlers are propagated to error middleware (if any).
        let errorPropagatingHandlers: ExpressRequestHandler[] = handlers.map(handler => async (req, res, next) => {
            try {
                // If `handler` throws (sync) or rejects (async), we'll hit the catch clause either way.
                await (handler as ExpressRequestHandler)(req, res, next);
            }
            catch (err) {
                // Unhandled error from handler - call `next` with the error to trigger error middleware (if any).
                next(err);
            }
        });

        // Register the list of wrapped handlers for the given method/path with the underlying express app/router.
        // Also prepend middleware that ensures req/res objects are validated and have excess properties removed.
        const m = method.toLowerCase() as 'get' | 'post';
        const validateRequestProps = createRequestPropValidationMiddleware(options.requestProps || t.unknown);
        const validateBodies = createBodyValidationMiddleware(routeInfo, options.onValidationError);
        router[m](path, validateRequestProps, validateBodies, ...errorPropagatingHandlers);
    }
}


/** A strongly-typed express application/router. */
export type DecoratedExpressRouter<S extends HttpSchema, R extends IRouter, ReqProps extends TypeInfo> =
    & ExpressRequestHandler
    & Omit<R, 'get' | 'post'>
    & {
        get<P extends Paths<S, 'GET'>>(
            path: P,
            ...handlers: Array<RequestHandler<S, 'GET', P, TypeFromTypeInfo<ReqProps>> | Array<ExpressRequestHandler | ErrorRequestHandler>>
        ): void;
        post<P extends Paths<S, 'POST'>>(
            path: P,
            ...handlers: Array<RequestHandler<S, 'POST', P, TypeFromTypeInfo<ReqProps>> | Array<ExpressRequestHandler | ErrorRequestHandler>>
        ): void;
    };


/** Creates a middleware function that validates request properties against the given schema. */
function createRequestPropValidationMiddleware(requestProps: TypeInfo): ExpressRequestHandler {
    return (req, _, next) => {
        assert(requestProps, req);
        next();
    };
}


/** Creates a middleware function that validates request params/body and response body for the given `routeInfo`. */
function createBodyValidationMiddleware(routeInfo: HttpSchema[any], onValidationError?: ErrorRequestHandler): ExpressRequestHandler {
    onValidationError = onValidationError ?? ((err, _, res) => {
        res.status(400).send('The request body did not conform to the required schema.');
    });

    return (req, res, next) => {

        // Validate the incoming request params (parsed out of the request path by express) against the schema.
        // If the params object is not as expected, it is likely a server-side configuration error, such as `path`
        // and `params` not matching properly in the HTTP schema. Since the error is likely server-side, pass the
        // error to `next`. This will skip subsequent middleware and trigger error middleware (if any).
        let actualParamNames = Object.keys(req.params);
        let expectedParamNames = routeInfo.paramNames || [];
        let missingParamNames = expectedParamNames.filter(p => !actualParamNames.includes(p));
        let excessParamNames = actualParamNames.filter(p => !expectedParamNames.includes(p));
        if (missingParamNames.length > 0 || excessParamNames.length > 0) {
            let msg = 'The request parameters did not conform to the required schema.';
            if (missingParamNames.length > 0) msg += ` Missing: "${missingParamNames.join('", "')}".`;
            if (excessParamNames.length > 0) msg += ` Excess: "${excessParamNames.join('", "')}".`;
            return next(new Error(msg));
        }

        // Validate and clean the incoming request body against the schema. If the request body is invalid,
        // delegate to the `onValidationError` handler, which is expected to respond appropriately.
        // If no `onValidationError` callback is given, the default behaviour is to send a 400 response, since
        // having an invalid request structure signifies a client error.
        try {
            // TODO: test that this actually replaces the req.body value
            // TODO: doc that req.body will always be an empty object, and not undefined, if no body was sent
            req.body = validateAndClean(req.body, routeInfo.requestBody ?? t.object({}));
        }
        catch (err) {
            onValidationError!(err, req, res, next);
            return;
        }

        // Ensure outgoing response bodies are validated and cleaned against the schema before they are sent.
        // This is done by wrapping methods on the `res` object, so subsequent handlers call the wrapped versions.
        // Note that validation errors will throw in the handler that caused them, in which case the error will
        // be passed to `next` and hence any error handling middleware (by default will respond with a 500 error).
        const {json, jsonp, send} = res; // the original json/jsonp/send methods to be wrapped
        res = Object.assign(res, {
            json: (body: unknown) => json.call(res, validateAndClean(body, routeInfo.responseBody)),
            jsonp: (body: unknown) => jsonp.call(res, validateAndClean(body, routeInfo.responseBody)),
            send: (body: unknown) => typeof body === 'string' ? send.call(res, body) : res.json(body),
        });

        // Param/body checking is done. Pass on to subsequent middleware for further processing.
        next();
    };

    // Helper function to runtime-validate that the body is the expected type, and to remove excess properties.
    function validateAndClean(value: unknown, type: TypeInfo = t.undefined) {
        assert(type, value);
        value = removeExcessProperties(type, value);
        return value;
    }
}


// Helper function - equivelent of Array#flat, which is newish.
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
function flatDeep(arr: any): any {
    return arr.reduce((acc: any, val: any) => acc.concat(Array.isArray(val) ? flatDeep(val) : val), []);
};
