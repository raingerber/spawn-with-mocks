const cmd = process.argv[2]
const args = process.argv.slice(3)

const id = (
  'SHELL__MOCK__ID__' +
  Date.now().toString(36) +
  Math.random().toString(36).slice(2)
)

// This should keep the process alive to wait for a message
process.on('message', onMessageReceived)

process.send({ cmd, args, id })

function onMessageReceived (data) {
  if (data.id === id) {
    process.stdout.write(data.stdout || '')
    process.stderr.write(data.stderr || '')
    // process.off('message', onMessageReceived)
    process.exit(data.code || 0)
  }
}
