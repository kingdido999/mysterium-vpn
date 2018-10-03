// @flow

import dependencies from './../dependencies'

const bugReporter = () => {
  return dependencies.get('bugReporter')
}

const bugReporterMetrics = () => {
  return dependencies.get('bugReporterMetrics')
}

export { bugReporter, bugReporterMetrics }
