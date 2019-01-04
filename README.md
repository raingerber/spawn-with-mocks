# spawn-with-mocks

> Mock shell commands with JavaScript

Intended for testing scripts where specific commands should be mocked. It gives access to the input and output for each mock, which can be used for making assertions.

[![Build Status](https://travis-ci.org/raingerber/spawn-with-mocks.svg?branch=master)](https://travis-ci.org/raingerber/spawn-with-mocks) [![codecov](https://codecov.io/gh/raingerber/spawn-with-mocks/branch/master/graph/badge.svg)](https://codecov.io/gh/raingerber/spawn-with-mocks)

## Example

In this script, we use `curl` to make a network request, then `grep` to filter by the letter F:

```bash
# example.sh

curl "<some-example-url>" | grep F
```

When testing the script, we decide to mock `curl`, but not `grep`:

```javascript
const spawn = require('spawn-with-mocks').spawnPromise
const assert = require('assert')

const testFile = './example.sh'

const options = {
  mocks: {
    // Creating the mock:
    curl: (input) => {
      assert.strictEqual(input, '<some-example-url>')
      // Defining the mock output:
      return {
        exit: 0,
        stdout: ['Frog', 'Shrimp', 'Crab'].join('\n'),
        stderr: ''
      }
    }
  }
}

const data = await spawn('sh', [testFile], options)

assert.deepStrictEqual(data, {
  code: 0,
  signal: '',
  // grep is not being mocked, so the
  // actual grep command will be used
  stdout: 'Frog\n',
  stderr: ''
})
```

## API

### spawn (command[, args][, options])

Wrapper for [child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options), with a new option called `mocks`. It returns a new [ChildProcess](https://nodejs.org/api/child_process.html#child_process_class_childprocess).

#### options.mocks

Each key is a shell command, and the values are functions that should return an `Object`, `Number`, or `String`.

**Object**

When returning objects, they can have the following properties:

* `code`

  * type: `Number`

  * default: `0`

  * exit the command with this status code

* `stdout`

  * type: `String`

  * default: `''`

  * pipe this to stdout

* `stderr`

  * type: `String`

  * default: `''`

  * pipe this to stderr

**Number**

If a mock returns a number, it will be used as `code` (`stdout` and `stderr` will be `""`).

**String**

If a mock returns a string, it will be used as `stdout` (`code` will be `0` and `stderr` will be `""`).

#### options.stdio

type: `String|Array`

The function also modifies the native [stdio option](https://nodejs.org/api/child_process.html#child_process_options_stdio). The last element of stdio will always be `'ipc'`, because the library uses that to message the spawned process. A ChildProcess can only have one IPC channel, so `'ipc'` should not be set by the input options.

### spawnPromise (command[, args][, options])

Like `spawn`, but it returns a Promise that resolves when the ChildProcess fires the `close` event. The resolved value is an object with these properties:

```javascript
{
  // The process exit code
  code: Number,
  // The signal that terminated the process
  signal: String,
  // The stdout from the process
  stdout: String,
  // The stderr from the process
  stderr: String
}
```

## How it Works

Each mock is an executable that's stored in a temporary `PATH` directory. Currently, the mocks do not work for all commands (such as builtins). This could be changed in a future version by using shell functions to create the mocks.

## LICENSE

MIT
