import fs from 'fs'
import { once } from 'events'
export default async (options) => {
  await fs.promises.mkdir(options.destination, { recursive: true });
  const stream = fs.createWriteStream(options.destination + options.filename)
  await once(stream, 'open')
  return stream
}