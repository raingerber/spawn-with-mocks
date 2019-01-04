/* eslint-env jest */

jest.mock('child_process')

const childProcess = require('child_process')
const spawnRunner = require('./spawn-runner')

let getEnvPathValue
const TEMP_DIR = '/var/folders/tmp'

beforeEach(() => {
  getEnvPathValue = jest.spyOn(spawnRunner, 'getEnvPathValue')
  getEnvPathValue.mockReturnValue('MOCK_PATH_VALUE')
})

afterEach(() => {
  getEnvPathValue.mockRestore()
})

describe('normalizeInput', () => {
  it('should normalize a string', () => {
    const input = 'ls'
    const normalized = spawnRunner.normalizeInput(input, TEMP_DIR)
    expect(normalized).toEqual([
      'ls',
      {
        env: {
          PATH: `${TEMP_DIR}:MOCK_PATH_VALUE`
        },
        stdio: [null, null, null, 'ipc']
      }
    ])
  })

  it('should normalize an array: [cmd]', () => {
    const input = ['ls']
    const normalized = spawnRunner.normalizeInput(input, TEMP_DIR)
    expect(normalized).toEqual([
      'ls',
      {
        env: {
          PATH: `${TEMP_DIR}:MOCK_PATH_VALUE`
        },
        stdio: [null, null, null, 'ipc']
      }
    ])
  })

  it('should normalize an array: [cmd, args]', () => {
    const input = ['ls', ['a', 2]]
    const normalized = spawnRunner.normalizeInput(input, TEMP_DIR)
    expect(normalized).toEqual([
      'ls',
      ['a', 2],
      {
        env: {
          PATH: `${TEMP_DIR}:MOCK_PATH_VALUE`
        },
        stdio: [null, null, null, 'ipc']
      }
    ])
  })

  it('should normalize an array: [cmd, options]', () => {
    const input = ['ls', { someOption: true }]
    const normalized = spawnRunner.normalizeInput(input, TEMP_DIR)
    expect(normalized).toEqual([
      'ls',
      {
        env: {
          PATH: `${TEMP_DIR}:MOCK_PATH_VALUE`
        },
        someOption: true,
        stdio: [null, null, null, 'ipc']
      }
    ])
  })

  it('should normalize an array: [cmd, args, options]', () => {
    const input = ['ls', ['a', 'b'], { someOption: true }]
    const normalized = spawnRunner.normalizeInput(input, TEMP_DIR)
    expect(normalized).toEqual([
      'ls',
      ['a', 'b'],
      {
        env: {
          PATH: `${TEMP_DIR}:MOCK_PATH_VALUE`
        },
        someOption: true,
        stdio: [null, null, null, 'ipc']
      }
    ])
  })
})

describe('normalizeOptions', () => {
  it('should use the default values when the input is {}', () => {
    const input = {}
    getEnvPathValue.mockReturnValueOnce(undefined)
    const normalized = spawnRunner.normalizeOptions(input, TEMP_DIR)
    expect(normalized).toEqual({
      env: {
        PATH: TEMP_DIR
      },
      stdio: [null, null, null, 'ipc']
    })
  })

  it('should transform the stdio string into an array', () => {
    const input = {
      stdio: 'inherit'
    }
    const normalized = spawnRunner.normalizeOptions(input, TEMP_DIR)
    expect(normalized).toEqual({
      env: {
        PATH: `${TEMP_DIR}:MOCK_PATH_VALUE`
      },
      stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    })
  })

  it('should add "ipc" to the stdio array', () => {
    const input = {
      stdio: ['ignore', null, 'inherit', 'inherit', 'pipe']
    }
    const normalized = spawnRunner.normalizeOptions(input, TEMP_DIR)
    expect(normalized).toEqual({
      env: {
        PATH: `${TEMP_DIR}:MOCK_PATH_VALUE`
      },
      stdio: ['ignore', null, 'inherit', 'inherit', 'pipe', 'ipc']
    })
  })

  it('should not add "ipc" when the stdio array contains it already', () => {
    const input = {
      stdio: ['ignore', null, 'inherit', 'ipc', 'pipe']
    }
    const normalized = spawnRunner.normalizeOptions(input, TEMP_DIR)
    expect(normalized).toEqual({
      env: {
        PATH: `${TEMP_DIR}:MOCK_PATH_VALUE`
      },
      stdio: ['ignore', null, 'inherit', 'ipc', 'pipe']
    })
  })
})

describe('normalizeSpawnReturnData', () => {
  it('should return the default object', () => {
    const expected = {
      code: 0,
      signal: '',
      stdout: '',
      stderr: ''
    }
    const received = spawnRunner.normalizeSpawnReturnData({
      code: false,
      signal: false,
      stdout: [],
      stderr: []
    })
    expect(expected).toEqual(received)
  })

  it('should normalize the input', () => {
    const createBuffers = a => a.map(s => Buffer.from(s))
    const expected = {
      code: 127,
      signal: 'MOCK_SIGNAL',
      stdout: `a b c
`,
      stderr: ` d ef
`
    }
    const received = spawnRunner.normalizeSpawnReturnData({
      code: 127,
      I: 'should get removed',
      signal: 'MOCK_SIGNAL',
      stdout: createBuffers(['a', ' b ', `c
`]),
      stderr: createBuffers([' d ', 'e', `f
`])
    })
    expect(received).toEqual(expected)
  })
})

describe('getEnvPathValue', () => {
  let PATH
  beforeAll(() => {
    PATH = process.env.PATH
  })
  beforeEach(() => {
    getEnvPathValue.mockRestore()
  })
  afterEach(() => {
    process.env.PATH = PATH
  })

  it('should use the custom PATH', () => {
    const input = {
      env: {
        PATH: 'MOCK_PATH_VALUE'
      }
    }
    const value = spawnRunner.getEnvPathValue(input)
    expect(value).toBe('MOCK_PATH_VALUE')
  })

  it('should use process.env.PATH when no custom value is provided', () => {
    process.env.PATH = 'MOCK_PATH_VALUE'
    const value1 = spawnRunner.getEnvPathValue({})
    const value2 = spawnRunner.getEnvPathValue({ env: {} })
    expect(value1).toBe('MOCK_PATH_VALUE')
    expect(value2).toBe('MOCK_PATH_VALUE')
  })

  it('should return an empty string when no PATH is found', () => {
    delete process.env.PATH
    const value = spawnRunner.getEnvPathValue({})
    expect(value).toBe('')
  })
})

describe('error case', () => {
  it('should call subprocess.kill() and reject(error) when "error" is fired', async () => {
    const input = ['sh', ['./test-scripts/hello-world.sh']]
    const output = spawnRunner.spawnPromiseWithMocks(input)
    const [emitter] = childProcess.spawn.mock.results
    emitter.value.emit('error', new Error('TEST_ERROR'))
    await expect(output).rejects.toThrow('TEST_ERROR')
    expect(emitter.value.kill).toHaveBeenCalledTimes(1)
  })
})
