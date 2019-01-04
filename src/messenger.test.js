/* eslint-env jest */

let argv
let send
let exitSpy
let stdoutSpy
let stderrSpy

beforeAll(() => {
  argv = process.argv
  send = process.send
  process.send = jest.fn()
  exitSpy = jest.spyOn(process, 'exit').mockReturnValue(undefined)
  stdoutSpy = jest.spyOn(process.stdout, 'write')
  stderrSpy = jest.spyOn(process.stderr, 'write')
})

afterEach(() => {
  process.argv = argv
  process.send.mockClear()
  exitSpy.mockClear()
  stdoutSpy.mockClear()
  stderrSpy.mockClear()
  jest.resetModules()
})

afterAll(() => {
  process.send = send
  exitSpy.mockRestore()
  stdoutSpy.mockRestore()
  stderrSpy.mockRestore()
})

describe('IPC messenger', () => {
  const idMatcher = expect.stringMatching(/^SHELL__MOCK__ID__[0-9a-zA-Z]+/)
  it('should call process.send when no args are provided', () => {
    process.argv = ['node', './messenger.js', 'ls']
    require('./messenger')

    const sendInput = process.send.mock.calls[0]
    expect(process.send).toHaveBeenCalledTimes(1)
    expect(sendInput).toEqual([{
      id: idMatcher,
      cmd: 'ls',
      args: []
    }])
  })

  it('should call process.send when args are provided', () => {
    process.argv = ['node', './messenger.js', 'mv', 'a', 'b']
    require('./messenger')

    const sendInput = process.send.mock.calls[0]
    expect(process.send).toHaveBeenCalledTimes(1)
    expect(sendInput).toEqual([{
      id: idMatcher,
      cmd: 'mv',
      args: ['a', 'b']
    }])
  })

  it('should not call onMessageReceived when the IDs do not match', () => {
    process.argv = ['node', './messenger.js', 'mv', 'a', 'b']
    require('./messenger')

    const message = {
      // This will not match the id that's generated in messenger.js
      id: 'bloopbloop',
      stdout: 'Electric',
      stderr: 'Boogaloo',
      code: 1
    }
    process.emit('message', message)
    expect(stdoutSpy).not.toHaveBeenCalled()
    expect(stderrSpy).not.toHaveBeenCalled()
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('should call stdout.write, stderr.write, and process.exit with default values', () => {
    process.argv = ['node', './messenger.js', 'mv', 'a', 'b']
    require('./messenger')

    const sendInput = process.send.mock.calls[0][0]
    const message = {
      id: sendInput.id
    }
    process.emit('message', message)
    expect(stdoutSpy).toHaveBeenCalledWith('')
    expect(stderrSpy).toHaveBeenCalledWith('')
    expect(exitSpy).toHaveBeenCalledWith(0)
  })

  it('should call stdout.write, stderr.write, and process.exit with the given values', () => {
    process.argv = ['node', './messenger.js', 'mv', 'a', 'b']
    require('./messenger')

    const sendInput = process.send.mock.calls[0][0]
    const message = {
      id: sendInput.id,
      stdout: 'Electric',
      stderr: 'Boogaloo',
      code: 1
    }
    process.emit('message', message)
    expect(stdoutSpy).toHaveBeenCalledWith('Electric')
    expect(stderrSpy).toHaveBeenCalledWith('Boogaloo')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
