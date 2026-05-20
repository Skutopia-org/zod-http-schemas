import { createHttpSchema } from '../../shared';
import { z as z4 } from 'zod/v4';

const customValidationErrorResponse = z4.object({
  success: z4.literal(false),
  code: z4.literal('MY_CUSTOM_VALIDATION_ERROR'),
});

export const testSchemaV4 = createHttpSchema({
  'GET /random-numbers': {
    responseBody: z4.array(z4.number()),
  },
  'POST /sum': {
    requestBody: z4.array(z4.number()),
    responseBody: z4.number().or(customValidationErrorResponse),
  },
  'POST /product': {
    requestBody: z4.array(z4.number()),
    responseBody: z4.number(),
  },
  'GET *': {
    requestBody: z4.object({
      name: z4.string(),
    }),
    responseBody: z4.unknown(),
  },
  'GET /404': {
    responseBody: z4.object({ error: z4.string() }),
  },
  'PUT /multiply': {
    requestBody: z4.object({ first: z4.number(), second: z4.number() }),
    responseBody: z4.number(),
  },
  'POST /sum/negative': {
    requestBody: z4.array(z4.number().int().negative()),
    responseBody: z4
      .number()
      .negative()
      .int()
      .or(customValidationErrorResponse),
  },
  'POST /sum/negative-broken': {
    requestBody: z4.array(z4.number().int().negative()),
    responseBody: z4.number().negative().int(),
  },
  'POST /sum/transform-string': {
    requestBody: z4.array(z4.string().transform((s) => parseInt(s, 10))),
    responseBody: z4.number().int(),
  },
  'POST /sum/transform-response': {
    requestBody: z4.array(z4.number().int()),
    responseBody: z4
      .number()
      .int()
      .transform((s) => s.toString()),
  },
  'POST /sum/with-query-param': {
    requestBody: z4.array(z4.number().int()),
    responseBody: z4.number().int(),
  },
});

// Used for testing get request without json body parser
export const testGetOnlySchemaV4 = createHttpSchema({
  'GET /random-numbers': {
    responseBody: z4.array(z4.number()),
  },
});
