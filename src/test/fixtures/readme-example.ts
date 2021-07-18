// ====================   SHARED   ====================
import {createHttpSchema, t} from '../..';

// Declare the http schema to be used by both client and server
const apiSchema = createHttpSchema({
    'POST /sum': {
        requestBody: t.array(t.number),
        responseBody: t.number,
    },
    'GET /greet/:name': {
        responseBody: t.string,
    },
});


// ====================   CLIENT-SIDE   ====================
import {createHttpClient} from '../../client';

// Create a strongly-typed http client. These are cheap to create - it's fine to have many of them.
const client = createHttpClient(apiSchema, {baseURL: '/api'});

// Some valid request examples
let res1 = client.post('/sum', {body: [1, 2]});                 // res1: Promise<number>
let res2 = client.get('/greet/:name', {params: {name: 'Bob'}}); // res2: Promise<string>

// Some invalid request examples
//let res3 = client.get('/sum', {body: [1, 2]});                  // tsc build error & runtime error
//let res4 = client.post('/sum', {body: 'foo'});                  // tsc build error & runtime error
//let res5 = client.post('/blah');                                // tsc build error & runtime error




// ====================   SERVER-SIDE   ====================
import * as express from 'express';
import {createRequestHandler, decorateExpressRouter} from '../../server';

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
//apiRouter.post('/blah', (req, res) => {/*...*/});           // tsc build error & runtime error
//apiRouter.post('/sum', (req, res) => { req.body.foo[0] });  // tsc build error & runtime error
//apiRouter.post('/sum', (req, res) => { res.send('foo') });  // tsc build error & runtime error

app.listen(8000);
