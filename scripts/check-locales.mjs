#!/usr/bin/env node
/**
 * The interface reads its strings from translations/<language>.lua in game and
 * from src/mock/locale.ts while `bun run dev` is running. Those two lists have
 * to hold the same keys: a key added to one and forgotten in the other shows
 * as a raw identifier on one side only, which is exactly the kind of thing
 * nobody notices until a player does.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()

/** Keys declared inside the `web = { … }` block of a translation file. */
const luaWebKeys = (file) => {
  const source = readFileSync(resolve(ROOT, file), 'utf8')
  const start = source.indexOf('web = {')

  if (start < 0) {
    throw new Error(`${file}: no web block`)
  }

  const block = source.slice(start)
  const keys = new Set()

  for (const match of block.matchAll(/\['([^']+)'\]\s*=/g)) {
    keys.add(match[1])
  }

  return keys
}

const mockKeys = (file) => {
  const source = readFileSync(resolve(ROOT, file), 'utf8')
  const keys = new Set()

  for (const match of source.matchAll(/^\s{2}'([^']+)':/gm)) {
    keys.add(match[1])
  }

  return keys
}

const difference = (a, b) => [...a].filter((key) => !b.has(key)).sort()

const reference = luaWebKeys('translations/fr.lua')
const sets = {
  'translations/en.lua': luaWebKeys('translations/en.lua'),
  'web/src/mock/locale.ts': mockKeys('web/src/mock/locale.ts'),
}

let failed = false

for (const [name, keys] of Object.entries(sets)) {
  const missing = difference(reference, keys)
  const extra = difference(keys, reference)

  if (missing.length > 0) {
    failed = true
    console.error(`${name}: ${missing.length} key(s) missing — ${missing.join(', ')}`)
  }

  if (extra.length > 0) {
    failed = true
    console.error(`${name}: ${extra.length} unknown key(s) — ${extra.join(', ')}`)
  }
}

if (failed) {
  process.exit(1)
}

console.log(`Locales are in sync: ${reference.size} interface key(s) across 3 files.`)
