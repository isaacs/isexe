import {resolve} from 'path'
import { chmodSync } from 'fs'

export const createFixtures = (t: Tap.Test) => {
  const dir = t.testdir({
    'meow.cat': '#!/usr/bin/env cat\nmeow\n',
    'mine.cat':'#!/usr/bin/env cat\nmine\n',
    'ours.cat':'#!/usr/bin/env cat\nours\n',
    'fail.false':'#!/usr/bin/env false\n',
  })

  const meow = resolve(dir, 'meow.cat')
  const mine = resolve(dir, 'mine.cat')
  const ours = resolve(dir, 'ours.cat')
  const fail = resolve(dir, 'fail.false')
  const enoent = resolve(dir, 'enoent.exe')
  const modes = {
    [meow]: 0o755,
    [mine]: 0o744,
    [ours]:0o754,
    [fail]:0o644,
  }
  for (const [path, mode] of Object.entries(modes)) {
    chmodSync(path, mode)
  }

  return { meow, mine, ours, fail, enoent, modes }
}
