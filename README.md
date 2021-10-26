# Zod Http Schemas[![npm monthly downloads](https://img.shields.io/npm/dm/zod-http-schemas.svg?style=flat-square)](https://www.npmjs.com/package/zod-http-schemas) [![current version](https://img.shields.io/npm/v/zod-http-schemas.svg?style=flat-square)](https://www.npmjs.com/package/zod-http-schemas) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

`zod-http-schemas` brings together the best parts of [http-schemas](https://github.com/yortus/http-schemas) and [zod](https://github.com/colinhacks/zod) into one library that:

* Declares the 'shape' of an HTTP API both at compile time and at runtime.
* Supports transformations and refinements.

At compile time it statically checks:

* HTTP requests in the client code
* Route handlers in the server code against the declared schema, ensuring usage errors are caught early.

At runtime, `zod-http-schemas`:
* validates that response and request payloads match the declared schema
* Trims response payloads of any excess properties, preventing information leaks

Use a shared schema for both client and server side code as a single source of truth, ensuring
the client and server always agree on the API.

`zod-http-schemas` uses the [`zod`](https://github.com/colinhacks/zod) library for specifying and enforcing schema types.

## Installation

`npm install zod-http-schemas`


## Example Shared Code (use in both client and server)
```ts
import {createHttpSchema} from 'zod-http-schemas';
import * as z from 'zod';

// Declare the http schema to be used by both client and server
export const apiSchema = createHttpSchema({
    'POST /sum': {
        requestBody: z.array(z.number()),
        responseBody: z.number(),
    },
    'GET /greet/:name': {
        responseBody: z.string(),
    },
});
```

## Example Client-Side Code
```ts
import {createHttpClient} from 'zod-http-schemas/client';
import {apiSchema} from '<path-to-shared-schema>';

// Create a strongly-typed http client. These are cheap to create - it's fine to have many of them.
const client = createHttpClient(apiSchema, {baseURL: '/api'});

// Some valid request examples
let res1 = client.post('/sum', {body: [1, 2]});                 // res1: Promise<number>
let res2 = client.get('/greet/:name', {params: {name: 'Bob'}}); // res2: Promise<string>

// Some invalid request examples
let res3 = client.get('/sum', {body: [1, 2]});                  // tsc build error & runtime error
let res4 = client.post('/sum', {body: 'foo'});                  // tsc build error & runtime error
let res5 = client.post('/blah');                                // tsc build error & runtime error
```

### Client-side implementation

`zod-http-schemas` uses [Axios](https://github.com/axios/axios) under the hood. Use the same config options with `createHttpClient` as you would with Axios.

_However_ `zod-http-schemas` uses its own default `validateStatus` option that will only reject status codes >= `500`. This lets you include common error responses in your schema, without losing typing.

For example, for a post endpoint you might specify

```typescript
export const apiSchema = createHttpSchema({
    'POST /article': {
        requestBody: NewArticle,
        responseBody: z.union([Article, MyGenericApiErrorType]),
    },
});
```

Now your clientside code might have a type-guard function that asserts:

```typescript
import {AxiosResponse} from "axios";

export const isNotErrorResponse = <T, E>(
    response: AxiosResponse<T> | AxiosResponse<MyGenericApiErrorType>
): response is AxiosResponse<T> => {
    return response.status < 400;
};
```

and used as such:

```typescript
const result = await apiClient.post('/article', {body: {title: 'Hello world'}});
if (isNotErrorResponse(result)) {
    // result is AxiosResponse<Article> in here
    console.log(result.body);
} else {
    // Some error occured, so result is typed AxiosResponse<MyGenericApiErrorType>
    console.error(result.body.myGenericErrorProperty)
}
```

## Example Server-Side Code
```ts
import * as express from 'express';
import {createRequestHandler, decorateExpressRouter} from 'http-schemas/server';
import {apiSchema} from '<path-to-shared-schema>';

// Create a strongly-typed express router.
const apiRouter = decorateExpressRouter({schema: apiSchema});

// Create a normal express app and mount the strongly-typed router.
const app = express();
app.use(express.json()); // it's a normal express app; mount whatever middleware you want
app.use('/api', apiRouter); // `apiRouter` is just middleware; mount it wherever you want

// Add a request handler directly to the router
apiRouter.post('/sum', (req, res) => {
    let result = req.body.reduce((sum, n) => sum + n, 0);
    res.send(result);
});

// Declare a request handler separately, then add it to the router
const greetHandler = createRequestHandler(apiSchema, 'GET', '/greet/:name', (req, res) => {
    res.send(`Hello, ${req.params.name}!`);
});
apiRouter.get('/greet/:name', greetHandler);

// Some invalid route handler examples
apiRouter.post('/blah', (req, res) => {/*...*/});           // tsc build error & runtime error
apiRouter.post('/sum', (req, res) => { req.body.foo[0] });  // tsc build error & runtime error
apiRouter.post('/sum', (req, res) => { res.send('foo') });  // tsc build error & runtime error

app.listen(8000);
```

## Full production-like webserver demo

The best way to see `http-schemas` in action is to see it in a real demonstration with documentation. Take a look at [http-schemas-webserver-demo](https://github.com/Antman261/http-schemas-webserver-demo), read the docs, run it and play with it yourself.
