// @flow

import Window from '../window'
import type { BasicApplication, ElectronApplication } from './kernel'
import { app } from 'electron'

class Application implements BasicApplication, ElectronApplication {
  _window: Window

  constructor (window: Window) {
    this._window = window
  }

  start (): void {
    this.onReady(() => {
    })
  }

  quit (): void {
    app.quit()
  }

  onReady (callback: Function): void {
    app.on('ready', () => {

    })
  }

  onWindowsClosed (callback: Function): void {
    //
  }

  onWillQuit (callback: Function): void {
    //
  }

  onActivate (callback: Function): void {
    //
  }
}

export default Application
