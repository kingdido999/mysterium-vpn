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

import { beforeEach, describe, expect, it } from '../../../helpers/dependencies'
import ProcessManager from '../../../../src/app/mysterium-client/process-manager'
import type { Installer, Process } from '../../../../src/libraries/mysterium-client'
import type {
  Monitoring,
  StatusCallback,
  EmptyCallback
} from '../../../../src/libraries/mysterium-client/monitoring'
import type { VersionCheck } from '../../../../src/libraries/mysterium-client/version-check'
import { buildMainCommunication } from '../../../../src/app/communication/main-communication'
import LogCache from '../../../../src/app/logging/log-cache'
import FeatureToggle from '../../../../src/app/features/feature-toggle'
import { buildRendererCommunication } from '../../../../src/app/communication/renderer-communication'
import { CallbackRecorder, captureAsyncError } from '../../../helpers/utils'
import DirectMessageBus from '../../../helpers/direct-message-bus'
import { SUDO_PROMT_PERMISSION_DENIED }
  from '../../../../src/libraries/mysterium-client/launch-daemon/launch-daemon-installer'

class InstallerMock implements Installer {
  needsInstallationMock: boolean = false
  installInvoked: boolean = false
  installErrorMock: ?Error = null

  async needsInstallation (): Promise<boolean> {
    return this.needsInstallationMock
  }

  async install (): Promise<void> {
    this.installInvoked = true
    if (this.installErrorMock) {
      throw this.installErrorMock
    }
  }
}

class ProcessMock implements Process {
  setupLoggingErrorMock: ?Error = null
  startInvoked: boolean = false

  async start (): Promise<void> {
    this.startInvoked = true
  }

  async repair (): Promise<void> {
  }

  async stop (): Promise<void> {
  }

  async kill (): Promise<void> {
  }

  onLog (level: string, callback: Function): void {
  }

  async setupLogging (): Promise<void> {
    if (this.setupLoggingErrorMock) {
      throw this.setupLoggingErrorMock
    }
  }
}

class MonitoringMock implements Monitoring {
  start (): void {
  }

  stop (): void {
  }

  onStatus (callback: StatusCallback): void {
  }

  onStatusUp (callback: EmptyCallback): void {
  }

  onStatusDown (callback: EmptyCallback): void {
  }

  isStarted (): boolean {
    return true
  }
}

class VersionCheckMock implements VersionCheck {
  async runningVersionMatchesPackageVersion (): Promise<boolean> {
    return true
  }
}

describe('ProcessManager', () => {
  let monitoring
  let installer
  let process
  let logCache
  let versionCheck
  let communication
  let featureToggle

  let processManager

  let remoteCommunication

  beforeEach(() => {
    monitoring = new MonitoringMock()
    installer = new InstallerMock()
    process = new ProcessMock()
    logCache = new LogCache()
    versionCheck = new VersionCheckMock()

    const messageBus = new DirectMessageBus()
    communication = buildMainCommunication(messageBus)
    remoteCommunication = buildRendererCommunication(messageBus)

    featureToggle = new FeatureToggle({})

    processManager = new ProcessManager(
      installer,
      process,
      monitoring,
      communication,
      logCache,
      versionCheck,
      featureToggle
    )
  })

  describe('.ensureInstallation', () => {
    it('installs when process needs it', async () => {
      installer.needsInstallationMock = true
      await processManager.ensureInstallation()
      expect(installer.installInvoked).to.be.true
    })

    it('does not install when process does not need it', async () => {
      installer.needsInstallationMock = false
      await processManager.ensureInstallation()
      expect(installer.installInvoked).to.be.false
    })

    describe('when installation fails', () => {
      beforeEach(() => {
        installer.needsInstallationMock = true
        installer.installErrorMock = new Error('Mock error')
      })

      it('throws error', async () => {
        const err = await captureAsyncError(() => processManager.ensureInstallation())
        if (!(err instanceof Error)) {
          throw new Error('Expected error')
        }
        expect(err.message).to.eql('Failed to install \'mysterium_client\' process. Mock error')
      })

      it('sends error message to renderer', async () => {
        const recorder = new CallbackRecorder()
        remoteCommunication.rendererShowError.on(recorder.getCallback())

        await captureAsyncError(() => processManager.ensureInstallation())

        expect(recorder.invoked).to.be.true
        expect(recorder.firstArgument).to.eql({ message: 'Failed to install MysteriumVPN.' })
      })

      it('sends permission message to renderer when permissions were denied', async () => {
        installer.installErrorMock = new Error(SUDO_PROMT_PERMISSION_DENIED)
        const recorder = new CallbackRecorder()
        remoteCommunication.rendererShowError.on(recorder.getCallback())

        await captureAsyncError(() => processManager.ensureInstallation())

        expect(recorder.invoked).to.be.true
        expect(recorder.firstArgument).to.eql({
          message: 'Failed to install MysteriumVPN. Please restart the app and grant permissions.'
        })
      })
    })
  })

  describe('.start', () => {
    it('starts process', async () => {
      await processManager.start()
      expect(process.startInvoked).to.be.true
    })

    it('starts process even when logging setup fails', async () => {
      process.setupLoggingErrorMock = new Error('mock error')
      await processManager.start()
      expect(process.startInvoked).to.be.true
    })
  })

  describe('.stop', () => {
    it('does not raise error', async () => {
      await processManager.stop()
    })
  })
})
