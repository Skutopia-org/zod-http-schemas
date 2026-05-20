import { createHttpClient } from '../../client';
import { testSchema } from './test-schema';
// import { testSchemaV4 as testSchema } from './test-schema-v4';

export function createTestClient() {
  return createHttpClient(testSchema, {
    baseURL: 'http://localhost:8000/api',
  });
}
