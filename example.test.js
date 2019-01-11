
/* eslint-env jest */

describe('example.js', () => {
  it('should resolve without errors', async () => {
    jest.resetModules()
    await expect(require('./example.js')).resolves.toMatchSnapshot()
  })
})
