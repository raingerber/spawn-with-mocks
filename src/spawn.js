const childProcess = require('child_process')

/**
 * @param {Array} spawnArgs - arguments for child_process.spawn
 * @param {Object} mocks - created with the help of createAliasFile
 * @returns {ChildProcess} the spawned child process
 */
function spawnProcess (spawnArgs, mocks) {
  const subprocess = childProcess.spawn(...spawnArgs)
  subprocess.on('message', data => {
    const id = data.id
    if (typeof id !== 'string' || id.indexOf('SHELL__MOCK__ID__') !== 0) {
      return
    }

    const cmd = data.cmd
    const args = data.args
    const mock = mocks[cmd]
    const mockOutput = module.exports.normalizeMockOutput(mock(...args))
    const response = { id, cmd, ...mockOutput }
    subprocess.send(response)
  })

  return subprocess
}

/**
 * @param {Number|String|Object} data
 * @returns {Object}
 */
function normalizeMockOutput (data) {
  const typeOfData = typeof data
  if (typeOfData === 'number') {
    data = {
      code: data
    }
  } else if (typeOfData === 'string') {
    data = {
      stdout: data
    }
  }
  return {
    code: data.code || 0,
    stdout: data.stdout || '',
    stderr: data.stderr || ''
  }
}

module.exports = {
  spawnProcess,
  normalizeMockOutput
}
