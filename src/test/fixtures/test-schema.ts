import {createHttpRoute, createHttpSchema, t} from '../../shared';


export const testSchema = createHttpSchema([
    createHttpRoute({
        method: 'GET',
        path: '/random-numbers',
        responseBody: t.array(t.number),
    }),
    createHttpRoute({
        method: 'POST',
        path: '/sum',
        requestBody: t.array(t.number),
        responseBody: t.number,
    }),
    createHttpRoute({
        method: 'POST',
        path: '/product',
        requestBody: t.array(t.number),
        responseBody: t.number,
    }),
    createHttpRoute({
        method: 'GET',
        path: '*',
        paramNames: ['0'],
        requestBody: t.object({name: t.string}),
        responseBody: t.unknown,
    }),
]);

export const testGetOnlySchema = createHttpSchema([
  // Used for testing get request without json body parser
    createHttpRoute({
        method: 'GET',
        path: '/random-numbers',
        responseBody: t.array(t.number),
    }),
])
