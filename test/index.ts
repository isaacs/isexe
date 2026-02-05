import t from 'tap'

import { isexe, posix, sync, win32 } from '../dist/esm/index.js'

const defPlatform = process.platform === 'win32' ? win32 : posix

t.test('get the default for this platform', t => {
  t.equal(isexe, defPlatform.isexe)
  t.equal(sync, defPlatform.sync)
  t.end()
})

t.test('get the default for the other platform', async t => {
  const fakePlatform = process.platform === 'win32' ? 'posix' : 'win32'
  process.env._ISEXE_TEST_PLATFORM_ = fakePlatform
  t.teardown(() => {
    delete process.env._ISEXE_TEST_PLATFORM_
  })
  const fake = await t.mockImport<typeof import('../dist/esm/index.js')>(
    '../dist/esm/index.js',
    {},
  )
  const other = process.platform === 'win32' ? fake.posix : fake.win32
  t.equal(fake.isexe, other.isexe)
  t.equal(fake.sync, other.sync)
})
