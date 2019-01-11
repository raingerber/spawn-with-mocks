// This should be kept up-to-date with the example in README.md

const spawn = require('./index').spawnPromise
const assert = require('assert')

const curl = (input) => {
  // The mock will receive the input
  // that was passed to the shell command
  assert.strictEqual(input, '<example-url>')
  // Defining the mock output:
  return {
    code: 0,
    stdout: ['Frog', 'Shrimp', 'Crab'].join('\n'),
    stderr: ''
  }
}

const options = {
  mocks: {
    curl
  }
}

// The exported value is a Promise
// that resolves to the data object
module.exports = (async () => {
  const data = await spawn('sh', ['./example.sh'], options)
  assert.deepStrictEqual(data, {
    code: 0,
    signal: '',
    // grep is not being mocked, so the
    // actual grep command will be used
    stdout: 'Frog\n',
    stderr: ''
  })
  return data
})()
