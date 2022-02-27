const { workerData, parentPort } = require("worker_threads");

const STOP_AFTER_ERRORS = 10

const q = new URL(workerData.url);
const protocol = (q.protocol == "http") ? require('http') : require('https');

const parameters = workerData

const stats = {
    s: 0,
    e: 0,
    lastE: null
}

parentPort.on('message', function (params) {
    attack()
        .then((result) => console.log(`${parameters.url} | ${result.status} | ${result.error}`))
        .catch((e) => console.error(`${parameters.url} | Failed | ${e}`))
})

const options = {
    path: q.pathname,
    hostname: q.hostname,
    port: q.port,
    method: parameters.type,
};

function attack() {
    return new Promise((res, rej) => {
        const req = protocol.request(
            options, 
            response => {
                res({
                    status: response.statusCode,
                    error: response.statusCode >= 300 ? response.statusMessage : 'OK'
                })
            }
        )
        req.on('error', rej)

        if (parameters.body)
            req.write(parameters.body)

        req.end()
    })
}

console.log('Endpoint initialized')