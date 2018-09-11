// @flow

// 2. make only single instance running
// 1. app startup event statistics
// 5. initialize communication callbacks
// 6. log unhandled exceptions
// 3. set logger
// 4. set session id
// 7. app on ready -> bootstrap()
// 8. app on window-all-closed
// 9. app on will-quit
// 10. app on activate
// 11. app before quit

import Kernel from './v2/kernel'
import Application from './v2/application'
import SingleAppInstanceIsRunningMiddleware from './v2/middlewares/single-app-instance-is-running-middleware'
import SendStartupEventMiddleware from './v2/middlewares/send-startup-event-middleware'
import logger from './logger'

const app = new Application(logger)
const kernel = new Kernel(app)
kernel.registerBeforeLaunchMiddleware(new SingleAppInstanceIsRunningMiddleware(app))
kernel.registerBeforeLaunchMiddleware(new SendStartupEventMiddleware())

kernel.registerAfterLaunchMiddleware(new AfterLaunchMiddleware())
kernel.registerAfterLaunchMiddleware(new AfterLaunchMiddleware())

kernel.bootstrap()

const electron = new Electron()
electron.onReady(kernel.onReady) // calls bootstrap
electron.onWindowsClosed(kernel.onWindowsClosed) // quits app except in OSX
electron.onWillQuit(kernel.onWillQuit) // stop monitoring, process, proposal fetcher (after hook)
electron.onActivate(kernel.onActivate) // show window

kernel.launchBeforeStartMiddlewares()
