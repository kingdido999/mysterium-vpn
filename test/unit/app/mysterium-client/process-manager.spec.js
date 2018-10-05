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

import { describe, expect, it } from '../../../helpers/dependencies'
import ProcessManager from '../../../../src/app/mysterium-client/process-manager'
import type { Installer, Process } from '../../../../src/libraries/mysterium-client'
import type {
  DownCallback,
  Monitoring,
  StatusCallback,
  UpCallback
} from '../../../../src/libraries/mysterium-client/monitoring'
import type { VersionCheck } from '../../../../src/libraries/mysterium-client/version-check'
import type { LogCache } from '../../../../src/app/logging/log-cache'
import { buildMainCommunication } from '../../../../src/app/communication/main-communication'
import FakeMessageBus from '../../../helpers/fake-message-bus'

class InstallerMock implements Installer {
  needsInstallation (): Promise<boolean> {
  }

  install (): Promise<void> {
  }
}

class ProcessMock implements Process {
  start (): Promise<void> {
  }

  repair (): Promise<void> {
  }

  stop (): Promise<void> {
  }

  kill (): Promise<void> {
  }

  onLog (level: string, callback: Function): void {
  }

  setupLogging (): Promise<void> {
  }
}

class MonitoringMock implements Monitoring {
  start (): void {
  }

  stop (): void {
  }

  onStatus (callback: StatusCallback): void {
  }

  onStatusUp (callback: UpCallback): void {
  }

  onStatusDown (callback: DownCallback): void {
  }

  get isStarted (): boolean {
  }
}

class LogCacheMock implements LogCache {

}

class VersionCheckMock implements VersionCheck {
  runningVersionMatchesPackageVersion (): Promise<boolean> {

  }
}

describe('ProcessManager', () => {
  const monitoring = new MonitoringMock()
  const installer = new InstallerMock()
  const process = new ProcessMock()
  const logCache = new LogCacheMock()
  const versionCheck = new VersionCheckMock()
  const communication = buildMainCommunication(new FakeMessageBus())

  const processManager = new ProcessManager(
    installer,
    process,
    monitoring,
    communication,
    logCache,
    versionCheck
  )

  describe('.runningVersionMatchesPackageVersion', () => {
    it('returns true when healthcheck version matches', async () => {
      const versionCheck = new VersionCheck(tequilapiClient, '1.0.0')
      expect(await versionCheck.runningVersionMatchesPackageVersion()).to.be.true
    })
  })
})
