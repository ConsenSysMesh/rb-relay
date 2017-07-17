const rlp = require('rlp')
const proof = require('merkle-patricia-proof')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io"))
var ep = new proof.EthProof(new Web3.providers.HttpProvider("https://mainnet.infura.io"))

var rbrelay = artifacts.require("./rbrelay.sol");

contract('rbrelay', function(accounts) {
  let rb
  rbrelay.deployed().then(function(instance) {
    rb = instance;
  }).catch(function(e) {
    throw new Error(e);
  })
  
  it("should verify tx 0x7c9cf78f89befd42332bf13d5afb5f27f14912739c3cca9a430c11c45837ce28", function() {
    var value, path, stack, txRoot
    ep.getTxProof('0x7c9cf78f89befd42332bf13d5afb5f27f14912739c3cca9a430c11c45837ce28', function(error,result) {
      //console.log(result)
      value = '0x' + rlp.encode(result.value).toString('hex')
      path = '0x' + result.path.toString('hex')
      stack = '0x' + rlp.encode(result.stack).toString('hex')
      txRoot = '0x' + result.header[4].toString('hex')
    })
    rb.verifyMerkleProof.call(value, path, stack, txRoot).then(function(result) {
        assert.equal(result, false)
  })
})