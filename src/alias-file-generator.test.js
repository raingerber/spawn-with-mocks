/* eslint-env jest */

const fs = require('fs')

const {
  FILE_OPTIONS,
  generateFileData,
  createAliasFiles
} = require('./alias-file-generator')

let writeFileSync

beforeEach(() => {
  writeFileSync = jest.spyOn(fs, 'writeFileSync').mockReturnValue(undefined)
})

afterEach(() => {
  writeFileSync.mockRestore()
})

describe('generateFileData', () => {
  it('should generate a string with or without the shebang', () => {
    expect(generateFileData('mv a/b /c/d/e')).not.toMatch(/^#!\/bin\/sh/)
    expect(generateFileData('mv a/b /c/d/e', '#!/bin/sh')).toMatch(/^#!\/bin\/sh/)
  })
})

describe('createAliasFiles', () => {
  it('should call fs.writeFileSync with the correct input', () => {
    const dir = '/var/folders/tmp'
    const commands = ['ls', 'mv', 'whatever']
    const result = createAliasFiles(dir, commands)
    const expectedResult = [
      '/var/folders/tmp/ls',
      '/var/folders/tmp/mv',
      '/var/folders/tmp/whatever'
    ]
    const messengerPath = require.resolve('./messenger.js')
    expect(writeFileSync.mock.calls).toEqual([
      [
        expectedResult[0],
        `node ${messengerPath} ls "$@"
`,
        FILE_OPTIONS
      ],
      [
        expectedResult[1],
        `node ${messengerPath} mv "$@"
`,
        FILE_OPTIONS
      ],
      [
        expectedResult[2],
        `node ${messengerPath} whatever "$@"
`,
        FILE_OPTIONS
      ]
    ])
    expect(result).toEqual(expectedResult)
  })
})
