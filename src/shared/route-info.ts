import {TypeInfo} from 'rtti';


/** Runtime type information about a single HTTP route. */
export interface RouteInfo<M extends 'GET' | 'POST', P extends string, N extends string> {
    method: M;
    path: P;
    paramNames?: N[];
    requestBody?: TypeInfo;
    responseBody?: TypeInfo;
}
