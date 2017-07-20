// var Web3 = require('web3')


helpers = () => {}

helpers.web3ify = (input) => {
  output = {}
  output.value = '0x' + rlp.encode(input.value).toString('hex')
  output.path = input.path.toString('hex')
  output.path = (output.path.length%2==0 ? '0x00' : '0x1') + output.path
  output.stack = '0x' + rlp.encode(input.stack).toString('hex')
  output.txRoot = '0x' + input.header[4].toString('hex')
  return output
}


module.exports = helpers
