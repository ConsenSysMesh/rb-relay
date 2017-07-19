const rlp = require('rlp')
const proof = require('merkle-patricia-proof')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io"))
var ep = new proof.EthProof(new Web3.providers.HttpProvider("https://mainnet.infura.io"))

var rbrelay = artifacts.require("./rbrelay.sol");

contract('rbrelay', function(accounts) {
  it("should verify tx 0x7c9cf78f89befd42332bf13d5afb5f27f14912739c3cca9a430c11c45837ce28", function(done) {
    var value, path, stack, txRoot
    ep.getTxProof('0x7c9cf78f89befd42332bf13d5afb5f27f14912739c3cca9a430c11c45837ce28', function(error,result) {
      console.log(result)
      value = '0x' + rlp.encode(result.value).toString('hex')
      path = result.path.toString('hex')
      path = (path.length%2==0 ? '0x00' : '0x1') + path
      stack = '0x' + rlp.encode(result.stack).toString('hex')
      txRoot = '0x' + result.header[4].toString('hex')

      console.log("value: " + value)
      console.log("path: " + path)
      console.log("stack: " + stack)
      console.log("txRoot: " + txRoot)
      //console.log("\nremix input: [" + hexToBytes(value)+"],["+hexToBytes(path)+"],["+hexToBytes(stack)+"],\""+txRoot+"\"")

      var rb
      return rbrelay.deployed().then(function(instance) {
        rb = instance;
        return rb.verifyMerkleProof.call(value, path, stack, txRoot)
      }).then(function(result) {
        console.log("nodekey: " + parseInt(result))
        assert.equal(parseInt(result), 11, "something went wrong")
        //assert.isTrue(result, "merkle proof wasn't valid")
      }).then(function() {
        done()
      })
    })
  })
})

function hexToBytes(hex) {
  hex = hex.slice(2);
  if(hex.length%2!=0) { hex = '0'+hex }

  var bytes = []
    for (var i = 0; i < hex.length/2; i++) {
      bytes.push("\"0x"+hex.slice(2*i,2*i+2)+"\"");
    }
    return bytes;
}