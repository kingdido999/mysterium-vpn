// @flow

import dependencies from './../dependencies'
import type { BugReporter } from '../../app/bug-reporting/interface'
import type { BugReporterMetrics } from '../../app/bug-reporting/metrics/bug-reporter-metrics'

const bugReporter = (): BugReporter => {
  return dependencies.get('bugReporter')
}

const bugReporterMetrics = (): BugReporterMetrics => {
  return dependencies.get('bugReporterMetrics')
}

export { bugReporter, bugReporterMetrics }
