import t from 'tap'

import { createFixtures } from './fixtures/index.js'
const { meow, fail, mine, ours, others, enoent, modes } = createFixtures(t)

import type { Stats } from 'fs'
import * as fs from 'fs'
import * as fsPromises from 'fs/promises'

// make windows ownership aware, and make for consistent
// uid/gid comparisons
const mockStat = (path: string, st: Stats) =>
  Object.assign(st, {
    uid: path === others || path === ours ? 987 : 123,
    gid: path === others ? 987 : 321,
    mode: !modes[path] ? st.mode : setMode(st.mode, modes[path]),
  })

const setMode = (orig: number, mode: number) => (orig & 0o7777000) | mode

const { getuid, getgid, getgroups } = process
t.teardown(() => {
  Object.assign(process, { getuid, getgid, getgroups })
})
Object.assign(process, {
  getuid: () => 123,
  getgid: () => 321,
  getgroups: () => [321, 987],
})

const { isexe, sync } = await t.mockImport<
  typeof import('../src/posix.js')
>('../src/posix.js', {
  fs: {
    ...fs,
    statSync: (path: string) => mockStat(path, fs.statSync(path)),
  },
  'fs/promises': {
    ...fsPromises,
    stat: async (path: string) =>
      mockStat(path, await fsPromises.stat(path)),
  },
})

t.test('basic tests', async t => {
  t.equal(await isexe(meow), true)
  t.equal(await isexe(ours), true)
  t.equal(await isexe(others), true)
  t.equal(await isexe(mine), true)
  t.equal(await isexe(fail), false)

  t.equal(sync(meow), true)
  t.equal(sync(ours), true)
  t.equal(sync(others), true)
  t.equal(sync(mine), true)
  t.equal(sync(fail), false)

  t.rejects(isexe(enoent), { code: 'ENOENT' })
  t.throws(() => sync(enoent), { code: 'ENOENT' })
  t.equal(await isexe(enoent, { ignoreErrors: true }), false)
  t.equal(sync(enoent, { ignoreErrors: true }), false)
})

t.test('override uid/gid', async t => {
  t.test('same uid, different gid', async t => {
    const o = { gid: 654, groups: [] }
    t.equal(await isexe(meow, o), true)
    t.equal(await isexe(ours, o), false)
    t.equal(await isexe(others, o), false)
    t.equal(await isexe(mine, o), true)
    t.equal(await isexe(fail, o), false)
    t.equal(sync(meow, o), true)
    t.equal(sync(ours, o), false)
    t.equal(sync(others, o), false)
    t.equal(sync(mine, o), true)
    t.equal(sync(fail, o), false)
  })

  t.test('different uid, same gid', async t => {
    const o = { uid: 456 }
    t.equal(await isexe(meow, o), true)
    t.equal(await isexe(ours, o), true)
    t.equal(await isexe(others, o), true)
    t.equal(await isexe(mine, o), false)
    t.equal(await isexe(fail, o), false)
    t.equal(sync(meow, o), true)
    t.equal(sync(ours, o), true)
    t.equal(sync(others, o), true)
    t.equal(sync(mine, o), false)
    t.equal(sync(fail, o), false)
  })

  t.test('different uid, different gid', async t => {
    const o = { uid: 456, gid: 654, groups: [] }
    t.equal(await isexe(meow, o), true)
    t.equal(await isexe(ours, o), false)
    t.equal(await isexe(others, o), false)
    t.equal(await isexe(mine, o), false)
    t.equal(await isexe(fail, o), false)
    t.equal(sync(meow, o), true)
    t.equal(sync(ours, o), false)
    t.equal(sync(others, o), false)
    t.equal(sync(mine, o), false)
    t.equal(sync(fail, o), false)
  })

  t.test('root can run anything runnable', async t => {
    const o = { uid: 0, gid: 999, groups: [] }
    t.equal(await isexe(meow, o), true)
    t.equal(await isexe(ours, o), true)
    t.equal(await isexe(others, o), true)
    t.equal(await isexe(mine, o), true)
    t.equal(await isexe(fail, o), false)
    t.equal(sync(meow, o), true)
    t.equal(sync(ours, o), true)
    t.equal(sync(others, o), true)
    t.equal(sync(mine, o), true)
    t.equal(sync(fail, o), false)
  })
})

t.test('getuid/getgid required', async t => {
  const { getuid, getgid, getgroups } = process
  t.teardown(() => {
    Object.assign(process, { getuid, getgid, getgroups })
  })
  process.getuid = undefined
  process.getgid = undefined
  process.getgroups = undefined
  t.throws(() => sync(meow), {
    message: 'cannot get uid or gid',
  })
  t.rejects(isexe(meow), {
    message: 'cannot get uid or gid',
  })
  // fine as long as a group/user is specified though
  t.equal(sync(meow, { uid: 999, groups: [321] }), true)
  t.equal(await isexe(meow, { uid: 999, groups: [321] }), true)
})
