const sleep = (millis) => new Promise((res) => setTimeout(res, millis))
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
const sleepRand = (from, to) => sleep(randomInt(from, to))
const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}
module.exports = {
    sleep,
    randomInt,
    sleepRand,
    shuffle,
}