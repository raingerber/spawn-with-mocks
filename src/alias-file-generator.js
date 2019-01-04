const fs = require('fs')
const path = require('path')

const FILE_OPTIONS = Object.freeze({
  encoding: 'utf8',
  mode: 0o755, // make it executable
  flag: 'w+'
})

/**
 * @param {String} cmd
 * @param {String} shebang
 * @returns {String}
 */
function generateFileData (cmd, shebang) {
  let result = shebang ? `${shebang}
` : ''
  const messengerPath = require.resolve('./messenger.js')
  result += `node ${messengerPath} ${cmd} "$@"
`
  return result
}

/**
 * @param {String} dir
 * @param {String} cmd
 * @param {String} shebang
 * @returns {String} the new filename
 */
function createAliasFile (dir, cmd, shebang) {
  const filename = path.join(dir, cmd)
  const fileData = module.exports.generateFileData(cmd, shebang)
  fs.writeFileSync(filename, fileData, FILE_OPTIONS)
  return filename
}

/**
 * @param {String} dir
 * @param {Array<String>} commands
 * @param {String} shebang
 * @returns {Array<String>} array of the new filenames
 */
function createAliasFiles (dir, commands, shebang) {
  return commands.map(cmd => {
    return module.exports.createAliasFile(dir, cmd, shebang)
  })
}

module.exports = {
  FILE_OPTIONS,
  generateFileData,
  createAliasFile,
  createAliasFiles
}
