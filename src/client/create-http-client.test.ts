// TODO: make into mocha tests

// import {t} from 'rtti';
// import {createHttpClient} from './create-http-client';
// import {httpRoute, httpSchema} from './http-schema';

// const s1 = httpSchema([
//     httpRoute({
//         method: 'POST',
//         path: '/do-thing',
//         namedParams: ['a123', 'a456'],
//         requestBody: t.object({
//             foo: t.string,
//             bar: t.unit(42),
//         }),
//     }),
//     httpRoute({
//         method: 'GET',
//         path: '/do-thing',
//         namedParams: ['ccc', 'ddd'],
//         responseBody: t.unit(42),
//     }),
//     httpRoute({
//         method: 'POST',
//         path: '/other-thing',
//         namedParams: [],
//         requestBody: t.array(t.number),
//         responseBody: t.date,
//     }),
//     httpRoute({
//         method: 'GET',
//         path: '/healthcheck',
//         requestBody: t.never,
//         responseBody: t.boolean,
//     }),
// ]);

// async function test() {
//     const client = createHttpClient(s1, {
//         withCredentials: true,
//     });

//     let res1 = await client.get('/do-thing', {
//         params: {ccc: 'ccc', ddd: 'ddd'},
//         //body: 42,
//     });

//     let res2 = await client.post('/do-thing', {
//         params: {a123: '11', a456: '22'},
//         body: {bar: 42, foo: 'sdsdf'},
//     });

//     let res3 = await client.post('/other-thing', {
//         body: [1, 2, 3],
//     });

//     let res4 = await client.get('/healthcheck');
// }
