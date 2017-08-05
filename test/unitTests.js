// const rlp = require('rlp')
// const EthProof = require('eth-proof')
// var h = require('./helpers');
// var Web3 = require('web3')
// var web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io"))
// var ep = new EthProof(new Web3.providers.HttpProvider("https://mainnet.infura.io"))

// var rbrelay = artifacts.require("./rbrelay.sol");




// contract('rbrelay', function(accounts) {
//   before((done) => {
//     ep.getTxProof('0x7c9cf78f89befd42332bf13d5afb5f27f14912739c3cca9a430c11c45837ce28').then((response) => {
//       txPrf1 = response
//       // console.log("startbefore")
//       return  ep.getTxProof('0xefbdc8136a1390d3b0fcd661cac873a3f8257cc8cff12b559f89cf26d8d0a49e')
//     }).then((response) => {
//       txPrf2 = response
//       return  ep.getReceiptProof('0x7c9cf78f89befd42332bf13d5afb5f27f14912739c3cca9a430c11c45837ce28')
//     }).then((response) => {
//       receiptPrf1 = response
//       return  ep.getReceiptProof('0xefbdc8136a1390d3b0fcd661cac873a3f8257cc8cff12b559f89cf26d8d0a49e')
//     }).then((response) => {
//       receiptPrf2 = response
//       return rbrelay.deployed()
//     }).then((_rb) => {
//         rb = _rb;
//       // console.log("finishbefore")
//       done()
//     })
//   })

//   it("getNthNibbleOfBytes should return a value at position n", function(done) {
//     rb.getNthNibbleOfBytes.call(0, "0x0123456789abcdef0123").then(function(result) {
//       assert.equal(parseInt(result,'hex')  , 0, "nth nibble should return x")
//       return rb.getNthNibbleOfBytes.call(1, "0x0123456789abcdef0123")
//     }).then(function(result) {
//       assert.equal(parseInt(result,'hex') , 1, "nth nibble should return x")
//       return rb.getNthNibbleOfBytes.call(6, "0x0123456789abcdef0123")
//     }).then(function(result) {
//       assert.equal(parseInt(result,'hex') , 6, "nth nibble should return x")
//       return rb.getNthNibbleOfBytes.call(15, "0x0123456789abcdef0123")
//     }).then(function(result) {
//       assert.equal(parseInt(result,'hex')  , 15, "nth nibble should return x")
//       return rb.getNthNibbleOfBytes.call(16, "0x0123456789abcdef0123")
//     }).then(function(result) {
//       assert.equal(parseInt(result,'hex')  , 0, "nth nibble should return x")
//       done()
//     })
//   })

//   it("should verify tx 0x7c9cf78f89befd42332bf13d5afb5f27f14912739c3cca9a430c11c45837ce28", function(done) {
//     var value, path, stack, txRoot
//     done()
//   })


// })
