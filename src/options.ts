export interface IsexeOptions {
  /**
   * Ignore errors arising from attempting to get file access status
   * Note that EACCES is always ignored, because that just means
   * it's not executable. If this is not set, then attempting to check
   * the executable-ness of a nonexistent file will raise ENOENT, for
   * example.
   */
  ignoreErrors?: boolean

  /**
   * effective uid when checking executable mode flags on posix
   * Defaults to process.getuid()
   */
  uid?: number

  /**
   * effective gid when checking executable mode flags on posix
   * Defaults to process.getgid()
   */
  gid?: number

  /**
   * The ;-delimited path extension list for win32 implementation.
   * Defaults to process.env.PATHEXT
   */
  pathExt?: string
}
