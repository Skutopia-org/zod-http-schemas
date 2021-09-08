import axios from 'axios';
import * as pathToRegExp from 'path-to-regexp';
import {Anonymize, NamedParams, Paths, RequestBody, ResponseBody} from '../util';
import {HttpSchema, Method} from '../shared';


/** Returns a strongly typed object for making requests to a remote HTTP server that implements the given `schema`. */
export function createHttpClient<S extends HttpSchema>(schema: S, options?: Partial<HttpClientOptions>): HttpClient<S> {

    // Create an axios client for making actual HTTP requests. Initialise it with the relevent given options, if any.
    const axiosClient = axios.create({
        baseURL: options?.baseURL,
        timeout: options?.timeout ?? 0,
        withCredentials: options?.withCredentials ?? false,
    });

    // Return a stringly-typed HTTP client.
    let result: HttpClient<S> = {
        get: (path, info?) => request('GET', path, info),
        post: (path, info?) => request('POST', path, info),
        put: (path, info?) => request('PUT', path, info),
        // TODO: other methods...
    };
    return result;

    // This function makes the actual HTTP requests through axios.
    async function request(method: Method, path: string, info?: {params?: any, body?: any}) {

        // Create the actual URL by substituting params (if any) into the path pattern.
        // NB: what axios calls `params` are really queryparams, so different from our `params`,
        // which are part of the path that is pattern-matched by express on the server.
        // NB2: pathToRegExp doesn't handle '*' wildcards like express, so we substitute those manually below.
        let i = 0;
        let url = pathToRegExp.compile(path)(info?.params).replace(/\*/g, () => info?.params[i++]);

        // Make the HTTP request through axios. We don't validate outgoing/incoming
        // bodies, since this is running on an untrusted client anyway.
        let res = await axiosClient({method, url, data: info?.body});

        // If the server returned a 4xx or 5xx error, throw it.
        if (res.status >= 400) {
            throw new Error(`There was an error communicating with the server: ${res.status} ${res.statusText}`);
        }

        // Return the body received from the server.
        return res.data;
    }
}


/** Options for `createHttpClient`. */
export interface HttpClientOptions {
    /** Will be prepended request paths unless they are absolute. Default is blank. */
    baseURL: string;

    /**
     * Specifies the number of milliseconds before the request times out.
     * A value of zero indicates no timeout should be applied. Default is zero.
     */
    timeout: number;

    /**
     * Indicates whether or not cross-site Access-Control requests should
     * be made using credentials. Default is false. See Axios docs.
     */
    withCredentials: boolean,
}


/** Strongly typed object for making requests to a remote HTTP server that implements the schema `S`. */
export type HttpClient<S extends HttpSchema> = {
    [M in Method as Lowercase<M>]: <P extends Paths<S, M>>(
        path: P,
        ...info: HasNamedParamsOrBody<S, M, P> extends false
            ? [RequestInfo<S, M, P>?]   // make the `info` arg optional if this route has no params/body
            : [RequestInfo<S, M, P>]    // make the `info` arg required if this route does have params/body
    ) => Promise<ResponseBody<S, M, P>>;
};


/** Strongly-typed object used to provide details for a HTTP request to a specific route. */
type RequestInfo<S extends HttpSchema, M extends Method, P extends S[keyof S]['path'] = string> = Anonymize<
    & (HasNamedParams<S, M, P> extends true
        ? {params: Record<NamedParams<S, M, P>, string>}    // make `params` required if this route does have named params
        : {params?: Record<string, never>})                 // make `params` optional if this route has no named params
    & (HasBody<S, M, P> extends true
        ? {body: RequestBody<S, M, P>}                      // make `body` required if this route does have a body
        : {body?: never})                                   // make `body` optional if this route has no body
>;

/** Helper type that resolves to `true` if the route for the given method/path has defined namedParams. */
type HasNamedParams<S extends HttpSchema, M extends Method, P extends S[keyof S]['path']>
    = NamedParams<S, M, P> extends never ? false : true;


/** Helper type that resolves to `true` if the route for the given method/path has defined requestBody. */
type HasBody<S extends HttpSchema, M extends Method, P extends S[keyof S]['path']>
    = RequestBody<S, M, P> extends undefined ? false : true;


/** Helper type that resolves to `true` if the route for the given method/path has namedParams and/or requestBody. */
type HasNamedParamsOrBody<S extends HttpSchema, M extends Method, P extends S[keyof S]['path']>
    = HasNamedParams<S, M, P> extends true ? true : HasBody<S, M, P>;
