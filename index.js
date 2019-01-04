const spawnRunner = require('./src/spawn-runner')

module.exports = {
  spawn: spawnRunner.spawnWithMocks,
  spawnPromise: spawnRunner.spawnPromiseWithMocks
}
