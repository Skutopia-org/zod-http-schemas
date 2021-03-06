// NB: express imports will be elided in the built js code, since we are only importing types.
import {
  NextFunction,
  Request,
  RequestHandler as ExpressRequestHandler,
  Response,
} from 'express';
import {
  ExtractMethod,
  ExtractPath,
  NamedParams,
  RequestBody,
  ResponseBody,
  ResponseBodyInput,
} from '../util';
import { HttpSchema, Method } from '../shared';
import { ZodType, ZodTypeAny } from 'zod';

/**
 * Accepts and returns a request handler function that is strongly-typed to match the given schema definition for the
 * given method and path. The function is returned as-is. This helper just provides convenient contextual typing.
 */
export function createRequestHandler<S extends HttpSchema, R extends keyof S>(
  schema: S,
  route: R,
  handler: RequestHandler<S, ExtractMethod<R>, ExtractPath<R>, {}>
): RequestHandler<S, ExtractMethod<R>, ExtractPath<R>, {}>;
export function createRequestHandler<
  S extends HttpSchema,
  R extends keyof S,
  ReqProps extends ZodTypeAny = ZodType<{}>
>(options: {
  schema: S;
  route: R;
  requestProps?: ReqProps;
  handler: RequestHandler<
    S,
    ExtractMethod<R>,
    ExtractPath<R>,
    ReqProps['_output']
  >;
}): RequestHandler<S, ExtractMethod<R>, ExtractPath<R>, {}>;
export function createRequestHandler(
  optionsOrSchema: unknown,
  route?: unknown,
  handler?: unknown
): ExpressRequestHandler {
  let h = (handler ??
    (optionsOrSchema as any).handler) as ExpressRequestHandler;
  let requestProps = handler
    ? undefined
    : ((optionsOrSchema as any).requestProps as ZodTypeAny);

  // If there are no request props to validate, return the given request handler as-is.
  if (!requestProps) return h;

  // Return a wrapped handler that validates the request props before invoking the given handler function.
  return (req, res, next) => {
    if (requestProps) {
      assertValid(requestProps, req);
    }
    h(req, res, next);
  };
}

function assertValid<T extends ZodTypeAny>(
  t: ZodTypeAny,
  v: unknown
): asserts v is T['_output'] {
  return t.parse(v);
}

/** A strongly-typed express request handler. */
export type RequestHandler<
  S extends HttpSchema,
  M extends Method,
  P extends S[any]['path'],
  Req
> = (
  req: TypedRequest<S, M, P, Req>,
  res: TypedResponse<S, M, P>,
  next: NextFunction
) => void | Promise<void>;

/** A strongly-typed express request. Some original props are omited and replaced with typed ones. */
type TypedRequest<
  S extends HttpSchema,
  M extends Method,
  P extends S[any]['path'],
  Req
> = Omit<Request<Record<NamedParams<S, M, P>, string>>, 'body'> &
  Req & {
    body: RequestBody<S, M, P> extends undefined ? {} : RequestBody<S, M, P>;
    [Symbol.asyncIterator](): AsyncIterableIterator<any>; // must add this back; not preserved by mapped types above
  };

/** A strongly-typed express response. Some original props are omited and replaced with typed ones. */
type TypedResponse<
  S extends HttpSchema,
  M extends Method,
  P extends S[any]['path']
> = Omit<Response, 'end' | 'json' | 'jsonp' | 'send' | 'status'> & {
  end: never;
  json: (body: ResponseBodyInput<S, M, P>) => TypedResponse<S, M, P>;
  jsonp: (body: ResponseBodyInput<S, M, P>) => TypedResponse<S, M, P>;
  send: (body: ResponseBodyInput<S, M, P>) => TypedResponse<S, M, P>;
  status: (code: number) => TypedResponse<S, M, P>;
};
