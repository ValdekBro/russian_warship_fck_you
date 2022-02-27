const sleep = (millis) => new Promise((res) => setTimeout(res, millis))
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
const sleepRand = (from, to) => sleep(randomInt(from, to))

module.exports = {
    sleep,
    randomInt,
    sleepRand,
}