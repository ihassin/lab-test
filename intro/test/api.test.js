'use strict';
const hapi = require('hapi');
const apiPlugin = require('../api');
const log4js = require('log4js');
log4js.configure({
  appenders: { unit: { type: 'file', filename: 'unit.log' } },
  categories: { default: { appenders: ['unit'], level: 'trace' } }
});

const code = require('code');
const lab = require('lab');
const labExport = exports.lab = lab.script();

var logger = log4js.getLogger('unit');

// let's get a server instance
const getServer = function () {
    const server = new hapi.Server();
    server.connection();

    return server.register(apiPlugin)
        .then(() => server);
};

labExport.test('Ensure that the server exists', (done) => {

    getServer()
        .then((server) => {

            code.expect(server).to.exist();
            logger.trace('Server exists');
            done();
        })
        .catch(done);
});

labExport.test('Simply test the unique route', (done) => {

    // What we will inject into the server
    const toInject = {
        method: 'POST',
        url: '/hello?item=10',
        payload: { alive: true }
    };

    getServer()
        // Inject let us pass a request to the server event if it is not started
        .then((server) => server.inject(toInject))
        // The server's response is given in a promise (or a callback if we wanted)
        .then((response) => {

            // we did not specified any other status-code, so 200 is th default one
            code.expect(response.statusCode).to.equal(200);
            logger.trace('200 OK');
            // We parse the payload as a JSON object
            const payload = JSON.parse(response.payload);
            // payload exists
            code.expect(payload).to.exist();
            // it has the fields named: 'alive', 'item' and 'parameter'
            code.expect(payload).to.contain(['alive', 'item', 'parameter']);

            // The values of each field is the one we expect
            code.expect(payload.alive).to.be.true();
            code.expect(payload.item).to.equal(10);
            code.expect(payload.parameter).to.equal('hello');
            done();
        })
        .catch(done);
});

labExport.test('Simple example of a bad request', (done) => {

    // What we will inject into the server
    const toInject = {
        method: 'POST',
        url: '/hello?item=101', // 101 > 100, this will fail !!
        payload: { alive: true }
    };

    getServer()
    // Inject let us pass a request to the server event if it is not started
        .then((server) => server.inject(toInject))
        // The server's response is given in a promise (or a callback if we wanted)
        .then((response) => {

            // we issued a bad request, the proper response status-code is 400 then
            code.expect(response.statusCode).to.equal(400);
            /**
             * response.payload is
             * {
             *   "statusCode":400,
             *   "error":"Bad Request","message":"child \"item\" fails because [\"item\" must be less than or equal to 100]",
             *   "validation":{"source":"query","keys":["item"]}
             * }
             */

            done();
        })
        .catch(done);
});
