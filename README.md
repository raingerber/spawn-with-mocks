# spawn-with-mocks

> Mock shell commands with JavaScript

Intended for testing shell scripts while mocking specific commands. Make assertions about the input for each command, and/or mock their stdout, stderr, and exit codes.

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

const curl = (input) => {
  // The mock will receive the input
  // that was passed to the shell command
  assert.strictEqual(input, '<some-example-url>')
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

const data = await spawn('sh', ['./example.sh'], options)

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

```javascript
{
  // exit the command with this status code (default: 0)
  code: Number,
  // pipe this to stdout (default: '')
  stdout: String,
  // pipe this to stderr (default: '')
  stderr: String
}
```

**Number**

If a mock returns a number, it will be used as `code`

- `stdout` and `stderr` will be `''`

**String**

If a mock returns a string, it will be used as `stdout`

- `code` will be `0` and `stderr` will be `''`

#### options.stdio

type: `String|Array`

The function also modifies the native [stdio option](https://nodejs.org/api/child_process.html#child_process_options_stdio). The last element of stdio will always be `'ipc'`, because the library uses that to message the spawned process. A [ChildProcess](https://nodejs.org/api/child_process.html#child_process_class_childprocess) can only have one IPC channel, so `'ipc'` should not be set by the input options.

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

## See Also

[jest-shell-matchers](https://www.npmjs.com/package/jest-shell-matchers) - make assertions about the output from spawn-with-mocks

## LICENSE

MIT
