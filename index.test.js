/* eslint-env jest */

const fs = require('fs')
const tmp = require('tmp')
const util = require('util')

const index = require('./index')
const spawn = require('./src/spawn')
const aliasGenerator = require('./src/alias-file-generator')

jest.unmock('child_process')

const access = util.promisify(fs.access)

let dirSyncSpy

beforeEach(() => {
  dirSyncSpy = jest.spyOn(tmp, 'dirSync')
})

afterEach(() => {
  dirSyncSpy.mockRestore()
})

describe('spawn', () => {
  it('should remove the tempDir when spawnProcess throws', () => {
    expect.assertions(1)
    const spy = jest.spyOn(spawn, 'spawnProcess')
    spy.mockImplementation(() => {
      throw new Error()
    })
    const input = ['sh', ['./test-scripts/hello-world.sh']]
    return index.spawnPromise(...input).catch(() => {
      const tempDir = dirSyncSpy.mock.results[0].value.name
      return access(tempDir, fs.constants.F_OK).catch(error => {
        expect(error.code).toBe('ENOENT')
        spy.mockRestore()
      })
    })
  })

  it('should remove the tempDir when createAliasFiles throws', () => {
    expect.assertions(1)
    const spy = jest.spyOn(aliasGenerator, 'createAliasFiles')
    spy.mockImplementation(() => {
      throw new Error()
    })
    const input = ['sh', ['./test-scripts/hello-world.sh']]
    return index.spawnPromise(...input).catch(() => {
      const tempDir = dirSyncSpy.mock.results[0].value.name
      return access(tempDir, fs.constants.F_OK).catch(error => {
        expect(error.code).toBe('ENOENT')
        spy.mockRestore()
      })
    })
  })

  it('should throw if "node" is one of the mocks', () => {
    const nodeMock = jest.fn()
    const input = ['sh', ['./test-scripts/hello-world.sh'], {
      mocks: {
        node: nodeMock
      }
    }]
    expect(nodeMock).not.toHaveBeenCalled()
    expect(index.spawnPromise(...input)).rejects.toThrowErrorMatchingSnapshot()
  })

  it('should ignore IPC messages sent by the user', async () => {
    expect.assertions(3)
    const input = ['sh', ['./test-scripts/ipc-invader.sh']]
    const data = await index.spawnPromise(...input)
    expect(data).toEqual({
      code: 0,
      signal: '',
      stderr: '',
      stdout: `Hello World
`
    })
    expect(dirSyncSpy).toHaveBeenCalledTimes(1)
    const tempDir = dirSyncSpy.mock.results[0].value.name
    return access(tempDir, fs.constants.F_OK).catch(error => {
      expect(error.code).toBe('ENOENT')
    })
  })

  it('should set environment variables', async () => {
    const input = [
      'sh',
      ['./test-scripts/log-env.sh'],
      {
        env: {
          AA: '_AA',
          BB: '_BB',
          CC: '_CC',
          DD: '_DD'
        }
      }
    ]
    const data = await index.spawnPromise(...input)
    expect(data).toEqual({
      code: 0,
      signal: '',
      stderr: `_BB
_DD
`,
      stdout: `_AA
_CC
`
    })
  })

  it('should work when ignoring stdio', async () => {
    const input = [
      'sh',
      ['./test-scripts/hello-world.sh'],
      {
        stdio: ['ignore', 'ignore', 'ignore', 'ignore']
      }
    ]
    const data = await index.spawnPromise(...input)
    expect(data).toEqual({
      code: 0,
      signal: '',
      stderr: '',
      stdout: ''
    })
  })

  it('should work when no mocks are provided', async () => {
    expect.assertions(3)
    const input = ['sh', ['./test-scripts/hello-world.sh']]
    const data = await index.spawnPromise(...input)
    expect(data).toEqual({
      code: 0,
      signal: '',
      stderr: '',
      stdout: `Hello World
`
    })
    expect(dirSyncSpy).toHaveBeenCalledTimes(1)
    const tempDir = dirSyncSpy.mock.results[0].value.name
    return access(tempDir, fs.constants.F_OK).catch(error => {
      expect(error.code).toBe('ENOENT')
    })
  })

  it('should pass a number as the argument', async () => {
    const input = [
      'sh',
      ['./test-scripts/exit-with-input.sh', 47]
    ]
    const data = await index.spawnPromise(...input)
    expect(data).toEqual({
      code: 47,
      signal: '',
      stderr: '',
      stdout: ''
    })
  })
})

describe('spawn with mocks', () => {
  it('should work when a mock is provided', async () => {
    const ls = jest.fn(() => {
      return {
        code: 127,
        stderr: 'MOCK_STDERR',
        stdout: 'MOCK_STDOUT'
      }
    })
    const input = [
      'sh',
      ['./test-scripts/ls.sh'],
      {
        mocks: { ls }
      }
    ]
    const data = await index.spawnPromise(...input)
    expect(data).toEqual({
      code: 127,
      signal: '',
      stderr: 'MOCK_STDERR',
      stdout: 'MOCK_STDOUT'
    })
  })

  it('should work when a mock and args are provided', async () => {
    const mv = jest.fn((file1, file2) => {
      return {
        code: 12,
        stderr: '',
        stdout: ''
      }
    })
    const args = ['./test-scripts/mv.sh', 'venus', 'pluto']
    const input = [
      'sh',
      args,
      {
        mocks: { mv }
      }
    ]
    const data = await index.spawnPromise(...input)
    expect(data).toEqual({
      code: 12,
      signal: '',
      stderr: '',
      stdout: ''
    })
    expect(mv).toHaveBeenCalledTimes(1)
    expect(mv).toHaveBeenCalledWith(...args.slice(1))
  })

  it('should work when returning a number from a mock', async () => {
    const mv = jest.fn((file1, file2) => {
      return 12
    })
    const args = ['./test-scripts/mv.sh', 'venus', 'pluto']
    const input = [
      'sh',
      args,
      {
        mocks: { mv }
      }
    ]
    const data = await index.spawnPromise(...input)
    expect(data).toEqual({
      code: 12,
      signal: '',
      stderr: '',
      stdout: ''
    })
    expect(mv).toHaveBeenCalledTimes(1)
    expect(mv).toHaveBeenCalledWith(...args.slice(1))
  })

  it('should work when returning a string from a mock', async () => {
    const mv = jest.fn((file1, file2) => {
      return 'MOCK_STDOUT'
    })
    const args = ['./test-scripts/mv.sh', 'venus', 'pluto']
    const input = [
      'sh',
      args,
      {
        mocks: { mv }
      }
    ]
    const data = await index.spawnPromise(...input)
    expect(data).toEqual({
      code: 0,
      signal: '',
      stderr: '',
      stdout: 'MOCK_STDOUT'
    })
    expect(mv).toHaveBeenCalledTimes(1)
    expect(mv).toHaveBeenCalledWith(...args.slice(1))
  })

  it('should call the ls mock several times', async () => {
    const ls = jest.fn()
    ls.mockImplementationOnce(() => {
      return {
        stdout: `quill
ignore
quip
ignore
`
      }
    })
    ls.mockImplementationOnce(() => {
      return {
        stdout: `ignore
quibble
ignore
`
      }
    })
    const input = [
      'sh',
      ['./test-scripts/ls-then-grep.sh'],
      {
        mocks: { ls }
      }
    ]
    const data = await index.spawnPromise(...input)
    expect(data).toEqual({
      code: 0,
      signal: '',
      stderr: `quibble
`,
      stdout: `quill
quip
`
    })
  })
})
