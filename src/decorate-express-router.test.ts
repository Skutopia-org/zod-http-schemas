import axios from 'axios';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as http from 'http';
import {t} from 'rtti';
import {decorateExpressRouter} from './decorate-express-router';
import {createHttpRoute, createHttpSchema, ParamNames, Paths, RequestBody, ResponseBody} from './create-http-schema';


describe('decorateExpressServer', () => {

    // Define middleware used across tests
    let middleware1 = compression();
    let middleware2 = helmet();
    let middleware3 = cookieParser();
    let addExtraProps: express.RequestHandler = (req, _, next) => {
        Object.assign(req, {aaa: 42, bbb: 'foo', ccc: true});
        next();
    };

    // Define schema used across tests
    const schema = createHttpSchema([
        createHttpRoute({
            method: 'POST',
            path: '/do-thing',
            // TODO: paramNames: ['a123', 'a456'],
            requestBody: t.object({
                foo: t.string,
                bar: t.unit(42),
            }),
        }),
        createHttpRoute({
            method: 'GET',
            path: '/do-thing',
            // TODO: paramNames: ['ccc', 'ddd'],
            //requestBody: t.undefined,
            responseBody: t.unit(42),
        }),
        createHttpRoute({
            method: 'POST',
            path: '/other-thing',
            paramNames: [],
            requestBody: t.array(t.number),
            responseBody: t.date,
        }),
        createHttpRoute({
            method: 'GET',
            path: '/healthcheck',
            requestBody: t.union(t.undefined, t.object({})),
            responseBody: t.object({success: t.boolean}),
        }),
        createHttpRoute({
            path: '/complex-type',
            method: 'GET',
            responseBody: t.union(
                t.intersection(
                    t.object({}),
                    t.object({
                        success: t.unit(true),
                        id: t.string,
                        outcome: t.array(t.intersection(
                            t.object({}),
                            t.object({
                                flag: t.optional(t.boolean),
                                kind: t.optional(t.union(t.unit('aaa'), t.unit('bbb'), t.unit('ccc'))),
                                amount: t.optional(t.number),
                            }),
                        )),
                        amount: t.number,
                    }),
                ),
                t.object({}),
            ),
        }),
    ]);

    // TODO: type-level tests... just for manual inspection (eg hover over LHSs in VSCode to see inferred types)
    type T1 = RequestBody<typeof schema, 'POST', '/do-thing'>;
    type T2 = ResponseBody<typeof schema, 'POST', '/do-thing'>;
    type T3 = ParamNames<typeof schema, 'POST', '/do-thing'>;
    type T4 = Paths<typeof schema, 'GET'>;
    type T5 = Paths<typeof schema, 'POST'>;


    it('works', async () => {
        const typedRouter = decorateExpressRouter({
            schema,
            router: express.Router(),
            requestProps: t.object({
                aaa: t.number,
                bbb: t.string,
            }),
        });
        typedRouter.get('/do-thing', middleware1, (req, res) => {
            //req.params.ccc
            req.body
            req.aaa
            req.bbb
            //req.ccc
            res.send(42);
        });
        typedRouter.post('/do-thing', middleware2, middleware3, (req, res) => {
            //req.params.a456;
            req.body.bar;
            //res.send('foo');
        });
        typedRouter.post('/other-thing', (req, res) => {
            //req.params.anything
            req.body[1].toExponential
            res.send(new Date());
        });
        typedRouter.get('/healthcheck', (req, res) => {
            req.params
            req.body
            res.send({success: true});
        });
        typedRouter.get('/complex-type', async (req, res) => {
            // v0.2.12 had a build error here: TS2589 Type instantiation is excessively deep and possibly infinite.
            res.send({}); 
        });

        const app = express();
        app.use(addExtraProps, typedRouter);

        let server = http.createServer(app).listen(8080, async () => {

            // do some tests...
            let res1 = await axios.get('http://localhost:8080/healthcheck');

            // Terminate the server...
            server.close(() => {
                // ...
            });
        });
    });
});
