// @flow

import type { Middleware } from '../kernel'
import StartupEventTracker from '../../statistics/startup-event-tracker'

class SendStartupEventMiddleware implements Middleware {
  _eventTracker: StartupEventTracker

  constructor (eventSender: StartupEventTracker) {
    this._eventTracker = eventSender
  }

  handle (): boolean {
    this._eventTracker.sendAppStartEvent()

    return true
  }
}

export default SendStartupEventMiddleware
