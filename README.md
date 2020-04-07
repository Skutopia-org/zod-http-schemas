# http-schemas

Use `http-schemas` to describe the 'shape' of a HTTP API in a way that is enforced both at build time and at runtime. In TypeScript source code, HTTP requests in the client code, and route handlers in the server code, will be statically checked against the schema, so usage errors are caught early. At runtime the schema is used to ensure that request and response payloads match the schema. Response payloads are also trimmed of any excess properties to prevent accidental information leaks. A schema may be shared by both client-side and server-side code, giving a single source of truth and ensuring the client and server always agree on their shared API.

`http-schemas` uses the [`rtti`](https://github.com/yortus/rtti) library for specifying and enforcing schemas.

## Installation

`npm install http-schemas`


## Basic Client-Side Usage
```ts
import {createHttpClient, createHttpRoute, createHttpSchema, t} from 'http-schemas/client';

const schema = createHttpSchema([
    createHttpRoute({
        method: 'GET',
        path: '/sum',
        requestBody: t.array(t.number),
        responseBody: t.number,
    }),
]);

const client = createHttpClient(schema);
client.get('/sum', {body: [1, 2]}); // returns Promise<number>
```


## Basic Server-Side Usage
```ts
import * as express from 'express';
import {createHttpRoute, createHttpSchema, decorateExpressRouter, t} from 'http-schemas/server';

const schema = createHttpSchema([
    createHttpRoute({
        method: 'GET',
        path: '/sum',
        requestBody: t.array(t.number),
        responseBody: t.number,
    }),
]);

const app = decorateExpressRouter({schema, router: express()});
app.get('/sum', (req, res) => {
    let result = req.body.reduce((sum, n) => sum + n, 0);
    res.send(result);
});
app.listen(8000);
```
