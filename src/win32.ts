/**
 * This is the Windows implementation of isexe, which uses the file
 * extension and PATHEXT setting.
 *
 * @module
 */

import { Stats, statSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { IsexeOptions } from './options.js'

/**
 * Determine whether a path is executable based on the file extension
 * and PATHEXT environment variable (or specified pathExt option)
 */
export const isexe = async (
  path: string,
  options: IsexeOptions = {},
): Promise<boolean> => {
  const { ignoreErrors = false } = options
  try {
    return checkStat(await stat(path), path, options)
  } catch (e) {
    const er = e as NodeJS.ErrnoException
    if (ignoreErrors || er.code === 'EACCES') return false
    throw er
  }
}

/**
 * Synchronously determine whether a path is executable based on the file
 * extension and PATHEXT environment variable (or specified pathExt option)
 */
export const sync = (
  path: string,
  options: IsexeOptions = {},
): boolean => {
  const { ignoreErrors = false } = options
  try {
    return checkStat(statSync(path), path, options)
  } catch (e) {
    const er = e as NodeJS.ErrnoException
    if (ignoreErrors || er.code === 'EACCES') return false
    throw er
  }
}

const checkPathExt = (path: string, options: IsexeOptions) => {
  const { pathExt = process.env.PATHEXT || '' } = options
  const peSplit = pathExt.split(';')
  if (peSplit.indexOf('') !== -1) {
    return true
  }

  for (const pes of peSplit) {
    const p = pes.toLowerCase()
    const ext = path.substring(path.length - p.length).toLowerCase()

    if (p && ext === p) {
      return true
    }
  }
  return false
}

const checkStat = (stat: Stats, path: string, options: IsexeOptions) =>
  stat.isFile() && checkPathExt(path, options)
