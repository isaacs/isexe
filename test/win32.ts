import { dirname, delimiter } from 'node:path'
import t from 'tap'
import { isexe, sync } from '../src/win32.js'

import { createFixtures } from './fixtures/index.js'
const { meow, fail, mine, ours, enoent } = createFixtures(t)

const { PATHEXT } = process.env
t.teardown(() => {
  if (PATHEXT) process.env.PATHEXT = PATHEXT
  else delete process.env.PATHEXT
})
process.env.PATHEXT = `.EXE${delimiter}.CAT${delimiter}.CMD${delimiter}.COM`

t.test('basic tests', async t => {
  t.equal(await isexe(meow), true)
  t.equal(await isexe(ours), true)
  t.equal(await isexe(mine), true)
  t.equal(await isexe(fail), false)
  t.equal(await isexe(dirname(meow)), false)

  t.equal(sync(meow), true)
  t.equal(sync(ours), true)
  t.equal(sync(mine), true)
  t.equal(sync(fail), false)
  t.equal(sync(dirname(meow)), false)

  t.rejects(isexe(enoent), { code: 'ENOENT' })
  t.throws(() => sync(enoent), { code: 'ENOENT' })
  t.equal(await isexe(enoent, { ignoreErrors: true }), false)
  t.equal(sync(enoent, { ignoreErrors: true }), false)
})

// no effect on win32 impl
t.test('uid/gid no effect on windows', async t => {
  const opts = { uid: 1, gid: 1 }
  t.equal(await isexe(meow, opts), true)
  t.equal(await isexe(ours, opts), true)
  t.equal(await isexe(mine, opts), true)
  t.equal(await isexe(fail, opts), false)
  t.equal(await isexe(enoent, { ignoreErrors: true, ...opts }), false)

  t.equal(sync(meow, opts), true)
  t.equal(sync(ours, opts), true)
  t.equal(sync(mine, opts), true)
  t.equal(sync(fail, opts), false)
  t.equal(sync(enoent, { ignoreErrors: true, ...opts }), false)
})

t.test('custom pathExt option', async t => {
  const opts = {
    pathExt: `.EXE${delimiter}.COM${delimiter}.CMD${delimiter}.FALSE`,
  }
  t.equal(await isexe(meow, opts), false)
  t.equal(await isexe(ours, opts), false)
  t.equal(await isexe(mine, opts), false)
  t.equal(await isexe(fail, opts), true)

  t.equal(sync(meow, opts), false)
  t.equal(sync(ours, opts), false)
  t.equal(sync(mine, opts), false)
  t.equal(sync(fail, opts), true)
})

t.test('empty pathext entry means everything executable', async t => {
  delete process.env.PATHEXT
  const opts = {
    pathExt: `.EXE${delimiter}.COM${delimiter}${delimiter}.CMD${delimiter}.ASDF`,
  }
  t.equal(await isexe(meow, opts), true)
  t.equal(await isexe(ours, opts), true)
  t.equal(await isexe(mine, opts), true)
  t.equal(await isexe(fail, opts), true)

  t.equal(sync(meow, opts), true)
  t.equal(sync(ours, opts), true)
  t.equal(sync(mine, opts), true)
  t.equal(sync(fail, opts), true)

  const empty = { pathExt: '' }
  t.equal(await isexe(meow, empty), true)
  t.equal(await isexe(ours, empty), true)
  t.equal(await isexe(mine, empty), true)
  t.equal(await isexe(fail, empty), true)

  t.equal(sync(meow, empty), true)
  t.equal(sync(ours, empty), true)
  t.equal(sync(mine, empty), true)
  t.equal(sync(fail, empty), true)

  t.equal(await isexe(meow), true)
  t.equal(await isexe(ours), true)
  t.equal(await isexe(mine), true)
  t.equal(await isexe(fail), true)

  t.equal(sync(meow), true)
  t.equal(sync(ours), true)
  t.equal(sync(mine), true)
  t.equal(sync(fail), true)
})
