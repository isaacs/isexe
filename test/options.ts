import t from 'tap'
t.pass('just a type test')

import { IsexeOptions } from '../src/options.js'

const opts: IsexeOptions[] = [
  { ignoreErrors: true },
  { ignoreErrors: false },
  { pathExt: 'asdf;foo' },
  { uid: 123, gid: 123, pathExt: 'asdf;foo' },
  //@ts-expect-error
  { ignoreErrors: 123 },
  //@ts-expect-error
  { pathExt: true },
  //@ts-expect-error
  { uid: true },
  //@ts-expect-error
  { gid: true },
]
opts
