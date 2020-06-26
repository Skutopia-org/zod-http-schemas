import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {createTestClient} from './fixtures/test-client';
import {createTestServer} from './fixtures/test-server';


chai.use(chaiAsPromised);
const {expect} = chai;


let client = createTestClient();
let server = createTestServer();
before(server.start);
after(server.stop);


describe('Implementing a HTTP client and server', () => {

    it('works', async () => {
        // GET /random-numbers
        let rnds = await client.get('/random-numbers');
        expect(rnds).to.be.an('array');
        rnds.every(n => expect(n).to.be.a('number'));

        // POST /add
        let sum = await client.post('/sum', {body: [1, 2, 3, 4]});
        expect(sum).equals(10);

        // POST /product
        let prod = await client.post('/product', {body: [10, 20, 30, 40]});
        expect(prod).equals(240_000);

        // GET *
        let blah = await client.get('/blah' as '*', {body: 'hello blah'});
        expect(blah).equals('hello blah');
    });
});
