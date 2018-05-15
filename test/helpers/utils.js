// @flow

/**
 * Returns a promise that is resolved after processing all currently queued events.
 */
function nextTick (): Promise<void> {
  return new Promise(resolve => process.nextTick(resolve))
}

/**
 * Runs async function and captures error of it's execution.
 */
async function capturePromiseError (promise: Promise<any>): ?Error {
  try {
    await promise
  } catch (e) {
    return e
  }
  return null
}

/**
 * Resolves promise and captures error of it's execution.
 */
async function captureAsyncError (func: () => Promise<any>) {
  return capturePromiseError(func())
}

/**
 * Records callback invocation. Useful for asserting that callback was invoked.
 */
class CallbackRecorder {
  invoked: boolean
  data: any

  constructor () {
    this.invoked = false
    this.data = null
  }

  /**
   * Returns function, which records it's invocation and argument
   * into current instance.
   *
   * @returns Function
   */
  getCallback (): (any) => void {
    return this._record.bind(this)
  }

  _record (data: any): void {
    this.invoked = true
    this.data = data
  }
}

export { nextTick, capturePromiseError, captureAsyncError, CallbackRecorder }
