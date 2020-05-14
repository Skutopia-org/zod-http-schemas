// NB: express imports will be elided in the built js code, since we are only importing types.
import {NextFunction, Request, Response} from 'express';
import {t, TypeFromTypeInfo, TypeInfo} from 'rtti';
import {ParamNames, RequestBody, ResponseBody} from '../util';
import {HttpSchema} from '../shared';


 /**
 * Accepts and returns a request handler function that is strongly-typed to match the given schema definition for the
 * given method and path. The function is returned as-is. This helper just provides convenient contextual typing.
 */
export function createRequestHandler<
    S extends HttpSchema,
    M extends 'GET' | 'POST',
    P extends S[any]['path'],
    Req extends TypeInfo = t.unknown,
>(_schema: S, _method: M, _path: P ,handler: RequestHandler<S, M, P, Req>) {
    return handler;
}


/** A strongly-typed express request handler. */
export type RequestHandler<S extends HttpSchema, M extends 'GET' | 'POST', P extends S[any]['path'], Req extends TypeInfo> =
    (req: TypedRequest<S, M, P, Req>, res: TypedResponse<S, M, P>, next: NextFunction) => void | Promise<void>;


/** A strongly-typed express request. Some original props are omited and replaced with typed ones. */
type TypedRequest<S extends HttpSchema, M extends 'GET' | 'POST', P extends S[any]['path'], Req extends TypeInfo> =
Omit<Request<Record<ParamNames<S, M, P>, string>>, 'body'>
& TypeFromTypeInfo<Req>
& {
    body: RequestBody<S, M, P> extends undefined ? {} : RequestBody<S, M, P>;
    [Symbol.asyncIterator](): AsyncIterableIterator<any>; // must add this back; not preserved by mapped types above
};


/** A strongly-typed express response. Some original props are omited and replaced with typed ones. */
type TypedResponse<S extends HttpSchema, M extends 'GET' | 'POST', P extends S[any]['path']> =
Omit<Response, 'end' | 'json' | 'jsonp' | 'send' | 'status'> & {
    end: never;
    json: (body: ResponseBody<S, M, P>) => TypedResponse<S, M, P>;
    jsonp: (body: ResponseBody<S, M, P>) => TypedResponse<S, M, P>;
    send: (body: ResponseBody<S, M, P>) => TypedResponse<S, M, P>;
    status: (code: number) => TypedResponse<S, M, P>;
};
