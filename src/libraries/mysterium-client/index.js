/*
 * Copyright (C) 2017 The "mysteriumnetwork/mysterium-vpn" Authors.
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

import type { Callback } from '../subscriber'
import logLevels from './log-levels'

type LogCallback = Callback<any>

interface Installer {
  needsInstallation (): Promise<boolean>,

  install (): Promise<void>
}

interface Process {
  start (): Promise<void>,

  repair (): Promise<void>,

  /**
   * Stop process gracefully.
   */
  stop (): Promise<void>,

  /**
   * Force-kill process.
   */
  kill (): Promise<void>,

  onLog (level: string, callback: Function): void,

  setupLogging (): Promise<void>
}

export { logLevels }
export type { Installer, Process, LogCallback }
