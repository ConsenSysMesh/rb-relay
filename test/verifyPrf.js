const rlp = require('rlp')
const h = require('./helpers')
const EthProof = require('eth-proof')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io"))
const ep = new EthProof(new Web3.providers.HttpProvider("https://mainnet.infura.io"))

const rbrelay = artifacts.require("./rbrelay.sol");

numToBuf = (input)=>{ return new Buffer(byteable(input.toString(16)), 'hex') }
stringToBuf = (input)=>{ input=input.slice(2); return new Buffer(byteable(input), 'hex') }
byteable = (input)=>{ return input.length % 2 == 0 ? input : '0' + input }

contract('rbrelay', function(accounts) {
  it("should verify tx any well formed proof", function(done) {
    var value, path, parentNodes, txRoot
    ep.getTransactionProof('0x7c9cf78f89befd42332bf13d5afb5f27f14912739c3cca9a430c11c45837ce28').then(function(result) {
      var proof = h.web3ify(result)
      var rb
      return rbrelay.deployed().then(function(instance) {
        rb = instance;
        return rb.trieValue.call(proof.value, proof.path, proof.parentNodes, proof.txRoot)
      }).then(function(result) {
        assert.isTrue(result, "merkle proof wasn't valid")
      }).then(function() {
        done()
      })
    })
  })


  it("should verify tx any well formed proof", function(done) {
    var value, path, parentNodes, txRoot
    ep.getTransactionProof('0x0bc1801ef2569d8ea0f121c138dcdb4fb3b1329ceb2bd79623b718e52aebb8e4').then(function(result) {
      // console.log(result)
      var proof = h.web3ify(result)
      var rb
      return rbrelay.deployed().then(function(instance) {
        rb = instance;
        return rb.trieValue.call(proof.value, proof.path, proof.parentNodes, proof.txRoot)
      }).then(function(result) {
        assert.isTrue(result, "something went wrong")
      }).then(function() {
        done()
      })
    })
  })


  it("should verify tx any well formed proof", function(done) {
    var value, path, parentNodes, txRoot
    ep.getTransactionProof('0x9d51ec5f48ed8a616a952d9b5872309af57ab2e03afd993022c0d5ce017702f2').then(function(result) {
      // console.log(result)
      var proof = h.web3ify(result)
      var rb
      return rbrelay.deployed().then(function(instance) {
        rb = instance;
        return rb.trieValue.call(proof.value, proof.path, proof.parentNodes, proof.txRoot)
      }).then(function(result) {
        assert.isTrue(result, "something went wrong")
      }).then(function() {
        done()
      })
    })
  })
})
