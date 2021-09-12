import { createHttpClient } from '../../client';
import { testSchema } from './test-schema';

export function createTestClient() {
  return createHttpClient(testSchema, {
    baseURL: 'http://localhost:8000/api',
  });
}
