var Web3 = require('web3')
var rlp = require('rlp');
var EthereumBlock = require('ethereumjs-block/from-rpc')

helpers = () => {}

helpers.web3ify = (input) => {
  output = {}
  output.value = '0x' + rlp.encode(input.value).toString('hex')
  output.header = '0x' + rlp.encode(input.header).toString('hex')
  output.path = '0x00' + input.path.toString('hex')
  //output.path = (output.path.length%2==0 ? '0x00' : '0x1') + output.path
  output.parentNodes = '0x' + rlp.encode(input.parentNodes).toString('hex')
  output.txRoot = '0x' + input.header[4].toString('hex')
  output.blockHash = '0x' + input.blockHash.toString('hex')
  return output
}

helpers.getRinkebyHeader = (blkNum, web3) => {
  // var web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))
  return new Promise((accept, reject) => {
    web3.eth.getBlock(blkNum, (e,r)=>{
      if(r){
        var rawHeaderString = '0x' + rlp.encode(getRawHeader(r)).toString('hex')
        accept(rawHeaderString)
      }else{
        reject(e)
      }
    })
  })
}
var getRawHeader = (_block) => {
  if(typeof _block.difficulty != 'string'){
    _block.difficulty = '0x' + _block.difficulty.toString(16)
  }
  var block = new EthereumBlock(_block)
  return block.header.raw
}


module.exports = helpers
