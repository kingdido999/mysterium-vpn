// @flow

interface Middleware {
  handle (): boolean
}

interface BasicApplication {
  start (): void,

  quit (): void
}

interface ElectronApplication {
  onReady (callback: Function): void,

  onWindowsClosed (callback: Function): void,

  onWillQuit (callback: Function): void,

  onActivate (callback: Function): void,

  isAlreadyRunning(): boolean
}

class Kernel {
  _app: BasicApplication
  _beforeLaunchMiddlewares: Array<Middleware>
  _afterLaunchMiddlewares: Array<Middleware>

  constructor (app: BasicApplication) {
    this._app = app
  }

  registerBeforeLaunchMiddleware (middleware: Middleware) {
    this._beforeLaunchMiddlewares.push(middleware)
  }

  registerAfterLaunchMiddleware (middleware: Middleware) {
    this._afterLaunchMiddlewares.push(middleware)
  }

  bootstrap () {
    this._runMiddlewares(this._beforeLaunchMiddlewares)
    this._app.start()
    this._runMiddlewares(this._afterLaunchMiddlewares)
  }

  _runMiddlewares (middlewares: Array<Middleware>) {
    // this could be refactored using first
    // the .first() one that returns false, terminates the app
    middlewares.forEach((middleware: Middleware) => {
      middleware.handle()
    })
  }
}

export default Kernel
export type { Middleware, BasicApplication, ElectronApplication }
