const { Worker } = require("worker_threads");
const { sleep, sleepRand } = require("./helpers");

const targets = require("./targets.json")

const buildEndpoint = (params) => new Worker('./worker.js', { workerData: params });
 
const endpoints = targets.map((params) => buildEndpoint(params))

const EXECUTION_LIMIT = 10
const TIMEOUT_BASE = 100

const run = async () => {
  await sleep(3000)

  for (let i = 0; i < EXECUTION_LIMIT; i++) {
    await sleepRand(TIMEOUT_BASE, TIMEOUT_BASE+1000)
    endpoints.forEach(endpoint => {
      endpoint.postMessage('attack')
    })
  }

}

run().catch(e => { throw e })
