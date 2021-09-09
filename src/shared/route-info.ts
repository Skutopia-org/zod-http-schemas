import {TypeInfo} from 'rtti';
import {Method} from './methods';

/** Runtime type information about a single HTTP route. */
export interface RouteInfo<M extends Method = Method, P extends string = string, N extends string = string> {
    method: M;
    path: P;
    namedParams: N[];
    requestBody: TypeInfo;
    responseBody: TypeInfo;
}
