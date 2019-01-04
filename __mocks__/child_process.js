/* eslint-env jest */

const EventEmitter = require('events')

const childProcess = jest.genMockFromModule('child_process')

function spawnMock (command, args, options) {
  const mockProcess = new EventEmitter()
  mockProcess.stdout = new EventEmitter()
  mockProcess.stderr = new EventEmitter()
  mockProcess.kill = jest.fn()
  return mockProcess
}

childProcess.spawn = jest.fn(spawnMock)

afterEach(() => {
  childProcess.spawn.mockClear()
})

module.exports = childProcess
