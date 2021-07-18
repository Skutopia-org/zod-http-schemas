import {createHttpSchema, t} from '../../shared';


export const testSchema = createHttpSchema({
    'GET /random-numbers': {
        responseBody: t.array(t.number),
    },
    'POST /sum': {
        requestBody: t.array(t.number),
        responseBody: t.number,
    },
    'POST /product': {
        requestBody: t.array(t.number),
        responseBody: t.number,
    },
    'GET *': {
        requestBody: t.object({
            name: t.string
        }),
        responseBody: t.unknown,
    },
});

// Used for testing get request without json body parser
export const testGetOnlySchema = createHttpSchema({
    'GET /random-numbers': {
        responseBody: t.array(t.number),
    },
});
