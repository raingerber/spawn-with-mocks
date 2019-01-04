/* eslint-env jest */

jest.mock('child_process')

const { normalizeMockOutput } = require('./spawn')

describe('normalizeMockOutput', () => {
  it('should treat numbers as exit codes', () => {
    const result = normalizeMockOutput(127)
    expect(result).toEqual({
      code: 127,
      stdout: '',
      stderr: ''
    })
  })

  it('should treat strings as stdout', () => {
    const result = normalizeMockOutput('MOCK_STDOUT')
    expect(result).toEqual({
      code: 0,
      stdout: 'MOCK_STDOUT',
      stderr: ''
    })
  })

  it('should return the defaults when an empty object is passed', () => {
    const result = normalizeMockOutput({})
    expect(result).toEqual({
      code: 0,
      stdout: '',
      stderr: ''
    })
  })

  it('should use the custom, untrimmed values', () => {
    const result = normalizeMockOutput({
      code: 127,
      stdout: `A
 `,
      stderr: `B 
 `
    })
    expect(result).toEqual({
      code: 127,
      stdout: `A
 `,
      stderr: `B 
 `
    })
  })
})
