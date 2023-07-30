import t from 'tap'

import { createFixtures } from './fixtures/index'
const { meow, fail, mine, ours, enoent, modes } = createFixtures(t)

const isWindows = process.platform === 'win32'

import type { Stats } from 'fs'
import * as fs from 'fs'
import * as fsPromises from 'fs/promises'

// make windows ownership aware, and make for consistent
// uid/gid comparisons
const mockStat = (path: string, st: Stats) =>
  Object.assign(st, {
    uid: 123,
    gid: 321,
    mode: !modes[path] ? st.mode : setMode(st.mode, modes[path]),
  })

const setMode = (orig: number, mode: number) => (orig & 0o7777000) | mode

const { getuid, getgid } = process
t.teardown(() => {
  Object.assign(process, { getuid, getgid })
})
Object.assign(process, {
  getuid: () => 123,
  getgid: () => 321,
})

const { isexe, sync } = t.mock('../dist/cjs/posix.js', {
  fs: {
    ...fs,
    statSync: (path: string) => mockStat(path, fs.statSync(path)),
  },
  'fs/promises': {
    ...fsPromises,
    stat: async (path: string) =>
      mockStat(path, await fsPromises.stat(path)),
  },
}) as typeof import('../dist/cjs/posix.js')

t.test('basic tests', async t => {
  t.equal(await isexe(meow), true)
  t.equal(await isexe(ours), true)
  t.equal(await isexe(mine), true)
  t.equal(await isexe(fail), false)

  t.equal(sync(meow), true)
  t.equal(sync(ours), true)
  t.equal(sync(mine), true)
  t.equal(sync(fail), false)

  t.rejects(isexe(enoent), { code: 'ENOENT' })
  t.throws(() => sync(enoent), { code: 'ENOENT' })
  t.equal(await isexe(enoent, { ignoreErrors: true }), false)
  t.equal(sync(enoent, { ignoreErrors: true }), false)
})

t.test('override uid/gid', async t => {
  t.test('same uid, different gid', async t => {
    const o = { gid: 654 }
    t.equal(await isexe(meow), true)
    t.equal(await isexe(ours), true)
    t.equal(await isexe(mine), true)
    t.equal(await isexe(fail), false)
    t.equal(sync(meow), true)
    t.equal(sync(ours), true)
    t.equal(sync(mine), true)
    t.equal(sync(fail), false)
  })

  t.test('different uid, same gid', async t => {
    const o = { uid: 456 }
    t.equal(await isexe(meow, o), true)
    t.equal(await isexe(ours, o), true)
    t.equal(await isexe(mine, o), false)
    t.equal(await isexe(fail, o), false)
    t.equal(sync(meow, o), true)
    t.equal(sync(ours, o), true)
    t.equal(sync(mine, o), false)
    t.equal(sync(fail, o), false)
  })

  t.test('different uid, different gid', async t => {
    const o = { uid: 456, gid: 654 }
    t.equal(await isexe(meow, o), true)
    t.equal(await isexe(ours, o), false)
    t.equal(await isexe(mine, o), false)
    t.equal(await isexe(fail, o), false)
    t.equal(sync(meow, o), true)
    t.equal(sync(ours, o), false)
    t.equal(sync(mine, o), false)
    t.equal(sync(fail, o), false)
  })
})

t.test('getuid/getgid required', async t => {
  const { getuid, getgid } = process
  t.teardown(() => { Object.assign(process, { getuid, getgid })})
  process.getuid = undefined
  process.getgid = undefined
  t.throws(() => sync(meow), {
    message: 'cannot get uid or gid'
  })
  t.rejects(isexe(meow), {
    message: 'cannot get uid or gid'
  })
})
