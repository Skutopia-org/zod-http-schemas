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
        requestBody: t.unknown,
        responseBody: t.unknown,
    }),
]);
