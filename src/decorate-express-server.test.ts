// TODO: make into mocha tests


// import {t} from 'rtti';
// import {decorateExpressServer} from './decorate-express-server';
// import {httpRoute, httpSchema, ParamNames, Paths, RequestPayload, ResponsePayload} from './http-schema';


// import * as express from 'express';
// import * as compression from 'compression';
// import * as cookieParser from 'cookie-parser';
// import * as helmet from 'helmet';
// let middleware1 = compression();
// let middleware2 = helmet();
// let middleware3 = cookieParser();


// const s1 = httpSchema([
//     httpRoute({
//         method: 'POST',
//         path: '/do-thing',
//         paramNames: ['a123', 'a456'],
//         requestPayload: t.object({
//             foo: t.string,
//             bar: t.unit(42),
//         }),
//     }),
//     httpRoute({
//         method: 'GET',
//         path: '/do-thing',
//         paramNames: ['ccc', 'ddd'],
//         //requestPayload: t.undefined,
//         responsePayload: t.unit(42),
//     }),
//     httpRoute({
//         method: 'POST',
//         path: '/other-thing',
//         paramNames: [],
//         requestPayload: t.array(t.number),
//         responsePayload: t.date,
//     }),
//     httpRoute({
//         method: 'GET',
//         path: '/healthcheck',
//     }),
// ]);


// type T1 = RequestPayload<typeof s1, 'POST', '/do-thing'>;
// type T2 = ResponsePayload<typeof s1, 'POST', '/do-thing'>;
// type T3 = ParamNames<typeof s1, 'POST', '/do-thing'>;
// type T4 = Paths<typeof s1, 'GET'>;
// type T5 = Paths<typeof s1, 'POST'>;


// const app = decorateExpressServer(s1, express.Router());

// app.get('/do-thing', middleware1, (req, res) => {
//     req.params.ccc
//     req.body
//     res.send(42);
// });

// app.post('/do-thing', middleware2, middleware3, (req, res) => {
//     req.params.a456;
//     req.body.bar;
//     //res.send('foo');
// });

// app.post('/other-thing', (req, res) => {
//     //req.params.anything
//     req.body[1].toExponential
//     res.send(new Date());
// });

// app.get('/healthcheck', (req, res) => {
//     req.params
//     req.body
//     res.send
// });
