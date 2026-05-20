import { Method } from './methods';
import { ZodTypeAnyVersion } from './AnyVersionZodType';

/** Runtime type information about a single HTTP route. */
export interface RouteInfo<
  M extends Method = Method,
  P extends string = string,
  N extends string = string
> {
  method: M;
  path: P;
  namedParams: N[];
  requestBody: ZodTypeAnyVersion;
  responseBody: ZodTypeAnyVersion;
}
