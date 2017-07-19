// var Web3 = require('web3')


helpers = () => {}

helpers.web3ify = (input) => {
  output = {}
  output.value = '0x' + rlp.encode(input.value).toString('hex')
  output.path = '0x' + input.path.toString('hex')
  output.stack = '0x' + rlp.encode(input.stack).toString('hex')
  output.txRoot = '0x' + input.header[4].toString('hex')
  return output
}


module.exports = helpers
