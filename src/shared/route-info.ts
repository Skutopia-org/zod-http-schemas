import { ZodSchema, ZodTypeAny } from 'zod';
import { Method } from './methods';

/** Runtime type information about a single HTTP route. */
export interface RouteInfo<
  M extends Method = Method,
  P extends string = string,
  N extends string = string
> {
  method: M;
  path: P;
  namedParams: N[];
  requestBody: ZodTypeAny;
  responseBody: ZodTypeAny;
}
