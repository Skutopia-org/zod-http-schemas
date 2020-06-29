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

    it('GET /random-numbers', async () => {
        let rnds = await client.get('/random-numbers');
        expect(rnds).to.be.an('array');
        rnds.every(n => expect(n).to.be.a('number'));
    });
    it('POST /add', async () => {
        let sum = await client.post('/sum', {body: [1, 2, 3, 4]});
        expect(sum).equals(10);
    });
    it('POST /product', async () => {
        let prod = await client.post('/product', {body: [10, 20, 30, 40]});
        expect(prod).equals(240_000);
    });
    it('GET *', async () => {
        let msg = await client.get('*', {params: {0: '/hello'}, body: {name: 'foo'}});
        expect(msg).equals('Hello, foo!');
    });
    it('GET * (invalid)', async () => {
        let getMsg = () => client.get('*', {params: {0: '/ciao'}, body: {name: 'bella'}});
        await expect(getMsg()).to.eventually.be.rejected;
    });
    it('Server-side validation error', async () => {
        let invalid = await client.post('/sum', {body: [1, '2', 3, 4] as number[]});
        expect(invalid).to.include({success: false, code: 'MY_CUSTOM_VALIDATION_ERROR'});
    });
});
