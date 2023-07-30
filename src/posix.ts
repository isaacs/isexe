/**
 * This is the Posix implementation of isexe, which uses the file
 * mode and uid/gid values.
 *
 * @module
 */

import { Stats, statSync } from 'fs'
import { stat } from 'fs/promises'
import { IsexeOptions } from './options'

/**
 * Determine whether a path is executable according to the mode and
 * current (or specified) user and group IDs.
 */
export const isexe = async (
  path: string,
  options: IsexeOptions = {}
): Promise<boolean> => {
  const { ignoreErrors = false } = options
  try {
    return checkStat(await stat(path), options)
  } catch (e) {
    const er = e as NodeJS.ErrnoException
    if (ignoreErrors || er.code === 'EACCES') return false
    throw er
  }
}

/**
 * Synchronously determine whether a path is executable according to
 * the mode and current (or specified) user and group IDs.
 */
export const sync = (
  path: string,
  options: IsexeOptions = {}
): boolean => {
  const { ignoreErrors = false } = options
  try {
    return checkStat(statSync(path), options)
  } catch (e) {
    const er = e as NodeJS.ErrnoException
    if (ignoreErrors || er.code === 'EACCES') return false
    throw er
  }
}

const checkStat = (stat: Stats, options: IsexeOptions) =>
  stat.isFile() && checkMode(stat, options)

const checkMode = (stat: Stats, options: IsexeOptions) => {
  const myUid = options.uid ?? process.getuid?.()
  const myGroups = options.groups ?? process.getgroups?.() ?? []
  const myGid = options.gid ?? process.getgid?.() ?? myGroups[0]
  if (myUid === undefined || myGid === undefined) {
    throw new Error('cannot get uid or gid')
  }

  const groups = new Set([myGid, ...myGroups])

  const mod = stat.mode
  const uid = stat.uid
  const gid = stat.gid

  const u = parseInt('100', 8)
  const g = parseInt('010', 8)
  const o = parseInt('001', 8)
  const ug = u | g

  return !!(
    mod & o ||
    (mod & g && groups.has(gid)) ||
    (mod & u && uid === myUid) ||
    (mod & ug && myUid === 0)
  )
}
