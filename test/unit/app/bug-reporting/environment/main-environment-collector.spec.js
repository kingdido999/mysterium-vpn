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

import { beforeEach, describe, expect, it } from '../../../../helpers/dependencies'
import MainEnvironmentCollector from '../../../../../src/app/bug-reporting/environment/main-environment-collector'
import LogCache from '../../../../../src/app/logging/log-cache'
import LogCacheBundle from '../../../../../src/app/logging/log-cache-bundle'
import type { BugReporterMetrics } from '../../../../../src/app/bug-reporting/metrics/bug-reporter-metrics'
import BugReporterMetricsStore from '../../../../../src/app/bug-reporting/metrics/bug-reporter-metrics-store'
import { TAGS } from '../../../../../src/app/bug-reporting/metrics/metrics'

describe('MainEnvironmentCollector', () => {
  const releaseID = 'id of release'
  let backendLogCache: LogCache
  let frontendLogCache: LogCache
  let mysteriumProcessLogCache: LogCache
  let bugReporterMetrics: BugReporterMetrics
  let collector: MainEnvironmentCollector

  beforeEach(() => {
    backendLogCache = new LogCache()
    frontendLogCache = new LogCache()
    mysteriumProcessLogCache = new LogCache()
    const logCacheBundle = new LogCacheBundle(backendLogCache, frontendLogCache, mysteriumProcessLogCache)
    bugReporterMetrics = new BugReporterMetricsStore()
    collector = new MainEnvironmentCollector(logCacheBundle, releaseID, bugReporterMetrics)
  })

  describe('.getReleaseId', () => {
    it('returns release id', () => {
      expect(collector.getReleaseId()).to.eql(releaseID)
    })
  })

  describe('.getSerializedCaches', () => {
    it('returns logs from cache', () => {
      backendLogCache.pushToLevel('info', 'backend info')
      backendLogCache.pushToLevel('error', 'backend error')
      frontendLogCache.pushToLevel('info', 'frontend info')
      frontendLogCache.pushToLevel('error', 'frontend error')
      mysteriumProcessLogCache.pushToLevel('info', 'mysterium info')
      mysteriumProcessLogCache.pushToLevel('error', 'mysterium error')

      expect(collector.getSerializedCaches()).to.eql({
        backend: { info: 'backend info', error: 'backend error' },
        frontend: { info: 'frontend info', error: 'frontend error' },
        mysterium_process: { info: 'mysterium info', error: 'mysterium error' }
      })
    })
  })

  describe('.getMetrics', () => {
    it('returns metrics from bug reporter metrics', () => {
      bugReporterMetrics.set(TAGS.CLIENT_RUNNING, true)
      expect(collector.getMetrics()).to.eql(bugReporterMetrics.getMetrics())
    })
  })
})
