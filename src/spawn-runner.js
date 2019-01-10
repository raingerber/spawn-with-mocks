const tmp = require('tmp')

const spawn = require('./spawn')
const aliasGenerator = require('./alias-file-generator')

/**
 * @returns {Object}
 */
function createTempDir () {
  return tmp.dirSync({
    prefix: 'temp-aliases-',
    unsafeCleanup: true
  })
}

/**
 * @param {String|Array} input - raw params for child_process.spawn
 * @returns {ChildProcess} the spawned child process
 */
function spawnWithMocks (...input) {
  const tmpObj = module.exports.createTempDir()
  input = module.exports.normalizeInput(input, tmpObj.name)
  const options = input[input.length - 1]
  const shebang = ''
  const mocks = options.mocks || {}
  const mockNames = Object.keys(mocks)
  if (mockNames.indexOf('node') !== -1) {
    tmpObj.removeCallback()
    throw new Error('spawn-with-mocks does not support mocking the node command')
  }

  let subprocess
  try {
    aliasGenerator.createAliasFiles(tmpObj.name, mockNames, shebang)
    subprocess = spawn.spawnProcess(input, mocks)
  } catch (error) {
    tmpObj.removeCallback()
    throw error
  }
  subprocess.on('close', () => {
    tmpObj.removeCallback()
  })
  return subprocess
}

/**
 * @param {String|Array} input - raw params for child_process.spawn
 * @returns {Promise<Object>} the spawned child process
 */
function spawnPromiseWithMocks (...input) {
  return new Promise((resolve, reject) => {
    const stdout = []
    const stderr = []
    const subprocess = module.exports.spawnWithMocks(...input)
    if (subprocess.stdout) {
      subprocess.stdout.on('data', data => stdout.push(data))
    }

    if (subprocess.stderr) {
      subprocess.stderr.on('data', data => stderr.push(data))
    }

    subprocess.on('close', (code, signal) => {
      const returnObj = module.exports.normalizeSpawnReturnData({
        code,
        signal,
        stdout,
        stderr
      })
      resolve(returnObj)
    })

    subprocess.on('error', error => {
      subprocess.kill()
      reject(error)
    })

    return subprocess
  })
}

/**
 * @param {String|Array} input - raw params for child_process.spawn
 * @param {String} tempDir
 * @returns {Array}
 */
function normalizeInput (input, tempDir) {
  if (Array.isArray(input)) {
    input = [...input]
  } else {
    input = [input]
  }

  // spawn's second parameter is an optional array
  const optionsIndex = Array.isArray(input[1]) ? 2 : 1
  let options = input[optionsIndex] || {}
  options = module.exports.normalizeOptions(options, tempDir)
  input[optionsIndex] = options
  return input
}

/**
 * @param {Object} options
 * @param {String} tempDir
 * @returns {Object}
 */
function normalizeOptions (options, tempDir) {
  const currentPath = module.exports.getEnvPathValue(options)
  const newPath = currentPath
    ? `${tempDir}:${currentPath}`
    : tempDir

  let stdio = options.stdio
  if (!stdio) {
    stdio = [null, null, null, 'ipc']
  } else if (typeof stdio === 'string') {
    stdio = [stdio, stdio, stdio, 'ipc']
  } else if (stdio.indexOf('ipc') === -1) {
    stdio.push('ipc')
  }

  return {
    ...options,
    env: {
      ...options.env,
      PATH: newPath
    },
    stdio
  }
}

/**
 * @param {Object} source - source data
 * @returns {Object} object to make assertions against
 */
function normalizeSpawnReturnData (source) {
  return {
    code: source.code || 0,
    signal: source.signal || '',
    stdout: Buffer.concat(source.stdout).toString(),
    stderr: Buffer.concat(source.stderr).toString()
  }
}

/**
 * @param {Object} options - spawn options
 * @returns {String}
 */
function getEnvPathValue (options) {
  return (options.env && options.env.PATH) || process.env.PATH || ''
}

module.exports = {
  createTempDir,
  spawnWithMocks,
  spawnPromiseWithMocks,
  normalizeInput,
  normalizeOptions,
  normalizeSpawnReturnData,
  getEnvPathValue
}
