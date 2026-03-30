import { cpSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'node_modules/dkfds/dist')
const dest = resolve(root, 'public/dkfds')

mkdirSync(dest, { recursive: true })

for (const dir of ['css', 'js', 'fonts', 'img']) {
  cpSync(resolve(src, dir), resolve(dest, dir), { recursive: true })
}

console.log('DKFDS assets copied to public/dkfds/')
