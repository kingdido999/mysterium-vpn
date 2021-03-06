/*
 * Copyright (C) 2018 The "mysteriumnetwork/mysterium-vpn" Authors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// @flow

import type { Installer, Process } from '../../libraries/mysterium-client'
import type { Monitoring, EmptyCallback } from '../../libraries/mysterium-client/monitoring'
import type { MainCommunication } from '../communication/main-communication'
import LogCache from '../logging/log-cache'
import VersionCheck from '../../libraries/mysterium-client/version-check'
import translations from '../messages'
import { SUDO_PROMT_PERMISSION_DENIED } from '../../libraries/mysterium-client/launch-daemon/launch-daemon-installer'
import logger from '../logger'
import { logLevels as processLogLevels } from '../../libraries/mysterium-client'
import { onFirstEventOrTimeout } from '../communication/utils'
import { METRICS } from '../bug-reporting/metrics/metrics'
import FeatureToggle from '../features/feature-toggle'
import type { BugReporter } from '../bug-reporting/interface'
import type { BugReporterMetrics } from '../bug-reporting/metrics/bug-reporter-metrics'

const LOG_PREFIX = '[ProcessManager]'
const MYSTERIUM_CLIENT_WAITING_THRESHOLD = 10000

class ProcessManager {
  _installer: Installer
  _process: Process
  _monitoring: Monitoring
  _communication: MainCommunication
  _logCache: LogCache
  _versionCheck: VersionCheck
  _featureToggle: FeatureToggle
  _bugReporter: BugReporter
  _bugReporterMetrics: BugReporterMetrics

  constructor (
    installer: Installer,
    process: Process,
    monitoring: Monitoring,
    communication: MainCommunication,
    logCache: LogCache,
    versionCheck: VersionCheck,
    featureToggle: FeatureToggle,
    bugReporter: BugReporter,
    bugReporterMetrics: BugReporterMetrics
  ) {
    this._installer = installer
    this._process = process
    this._monitoring = monitoring
    this._communication = communication
    this._logCache = logCache
    this._versionCheck = versionCheck
    this._featureToggle = featureToggle
    this._bugReporter = bugReporter
    this._bugReporterMetrics = bugReporterMetrics
  }

  async ensureInstallation () {
    const needsInstallation = await this._installer.needsInstallation()
    if (!needsInstallation) {
      return
    }
    await this._installProcess()
  }

  async start () {
    this._startLogging().catch(error => {
      this._logError(`Starting process logging failed.`, error.message)
      this._bugReporter.captureErrorException(error)
    })

    await this._startProcess()
    this._startStatusMonitoring()

    try {
      await this._ensureClientVersion()
    } finally {
      this._startStatusReporting()
      this._repairProcessOnProcessDown()
    }
  }

  async stop () {
    this._monitoring.stop()

    try {
      await this._process.stop()
    } catch (error) {
      this._logError(`Failed to stop 'mysterium_client' process`, error)

      this._bugReporter.captureErrorException(error)
    }
  }

  onStatusChangeUp (callback: EmptyCallback) {
    this._monitoring.onStatusChangeUp(callback)
  }

  onStatusChangeDown (callback: EmptyCallback) {
    this._monitoring.onStatusChangeDown(callback)
  }

  async _startLogging () {
    await this._process.setupLogging()
    this._process.onLog(processLogLevels.INFO, (data) => this._logCache.pushToLevel(processLogLevels.INFO, data))
    this._process.onLog(processLogLevels.ERROR, (data) => this._logCache.pushToLevel(processLogLevels.ERROR, data))
  }

  _startStatusMonitoring () {
    this._logInfo(`Starting 'mysterium_client' monitoring`)
    this._monitoring.start()
  }

  async _ensureClientVersion () {
    this._logInfo('Waiting for process to check version')
    await this._waitForProcessUp()
    if (await this._clientVersionMismatches()) {
      this._logInfo(`'mysterium_client' installed version does not match running version, killing it.`)
      await this._restartClient()
    } else {
      this._logInfo(`'mysterium_client' installed version matches running version`)
    }
  }

  async _restartClient () {
    try {
      this._logInfo('Restarting: killing process')
      await this._process.kill()

      this._logInfo('Restarting: waiting for process to be down')
      await this._waitForProcessDown()
      this._logInfo('Restarting: process is down, starting it up')
      await this._process.start()
      this._logInfo('Restarting: waiting for process to be up')
      await this._waitForProcessUp()
      this._logInfo('Restering: process is up')
    } catch (error) {
      this._logError(`Failed to restart 'mysterium_client' process`, error)
      throw error
    }
  }

  _waitForProcessDown (): Promise<void> {
    return onFirstEventOrTimeout(
      this._monitoring.onStatusDown.bind(this._monitoring),
      MYSTERIUM_CLIENT_WAITING_THRESHOLD)
  }

  _waitForProcessUp (): Promise<void> {
    return onFirstEventOrTimeout(
      this._monitoring.onStatusUp.bind(this._monitoring),
      MYSTERIUM_CLIENT_WAITING_THRESHOLD)
  }

  _startStatusReporting () {
    this._sendRendererHealthcheckUp()
    this._monitoring.onStatusChangeUp(() => this._sendRendererHealthcheckUp())
    this._monitoring.onStatusChangeDown(() => this._sendRendererHealthcheckDown())
  }

  _repairProcessOnProcessDown () {
    this._monitoring.onStatusDown(() => {
      this._repairProcess()
    })
  }

  _sendRendererHealthcheckDown () {
    this._logInfo(`'mysterium_client' is down`)

    this._communication.healthcheckDown.send()

    this._bugReporterMetrics.set(METRICS.CLIENT_RUNNING, false)
  }

  _sendRendererHealthcheckUp () {
    this._logInfo(`'mysterium_client' is up`)

    this._communication.healthcheckUp.send()

    this._bugReporterMetrics.set(METRICS.CLIENT_RUNNING, true)
  }

  async _startProcess () {
    this._logInfo(`Starting 'mysterium_client' process`)

    try {
      await this._process.start()
      this._logInfo(`'mysterium_client' started successful`)
    } catch (error) {
      this._logError(`'mysterium_client' start failed`, error)
    }
  }

  async _installProcess () {
    this._logInfo(`Installing 'mysterium_client' process`)

    try {
      await this._installer.install()
    } catch (error) {
      let messageForUser = translations.processInstallationError

      if (error.message === SUDO_PROMT_PERMISSION_DENIED) {
        messageForUser = translations.processInstallationPermissionsError
      }

      this._communication.rendererShowError.send({ message: messageForUser })

      throw new Error(`Failed to install 'mysterium_client' process. ` + error.message)
    }
  }

  async _clientVersionMismatches (): Promise<boolean> {
    if (!this._featureToggle.clientVersionCheckEnabled()) {
      this._logInfo('Client version check disabled')
      return false
    }

    this._logInfo('Checking client version')
    const matches = await this._versionCheck.runningVersionMatchesPackageVersion()
    return !matches
  }

  async _repairProcess () {
    this._logInfo(`Repairing 'mysterium_client' process`)

    try {
      await this._process.repair()
    } catch (error) {
      this._monitoring.stop()

      this._bugReporter.captureErrorException(error)

      this._communication.rendererShowError.send({ message: translations.processStartError })
    }
  }

  _logInfo (...data: Array<any>) {
    logger.info(this._formatLog(data))
  }

  _logError (...data: Array<any>) {
    logger.error(this._formatLog(data))
  }

  _formatLog (data: Array<any>) {
    return `${LOG_PREFIX} ${data.join(' ')}`
  }
}

export default ProcessManager
