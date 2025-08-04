/**
 * This is the Windows implementation of isexe, which uses the file
 * extension and PATHEXT setting.
 *
 * @module
 */

import { accessSync, constants } from 'fs'
import { access } from 'fs/promises'
import { IsexeOptions } from './options'

/**
 * Determine whether a path is executable based on the file extension
 * and PATHEXT environment variable (or specified pathExt option)
 */
export const isexe = async (
  path: string,
  options: IsexeOptions = {}
): Promise<boolean> => {
  const { ignoreErrors = false } = options
  try {
    await access(path, constants.F_OK)
    return checkPathExt(path, options)
  } catch (e) {
    const er = e as NodeJS.ErrnoException
    if (ignoreErrors || er.code === 'EACCES' || er.code === 'ENOENT') return false
    throw er
  }
}

/**
 * Synchronously determine whether a path is executable based on the file
 * extension and PATHEXT environment variable (or specified pathExt option)
 */
export const sync = (
  path: string,
  options: IsexeOptions = {}
): boolean => {
  const { ignoreErrors = false } = options
  try {
    accessSync(path, constants.F_OK)
    return checkPathExt(path, options)
  } catch (e) {
    const er = e as NodeJS.ErrnoException
    if (ignoreErrors || er.code === 'EACCES' || er.code === 'ENOENT') return false
    throw er
  }
}

const checkPathExt = (path: string, options: IsexeOptions) => {
  const { pathExt = process.env.PATHEXT || '' } = options
  const peSplit = pathExt.split(';')
  if (peSplit.indexOf('') !== -1) {
    return true
  }

  for (let i = 0; i < peSplit.length; i++) {
    const p = peSplit[i].toLowerCase()
    const ext = path.substring(path.length - p.length).toLowerCase()

    if (p && ext === p) {
      return true
    }
  }
  return false
}
