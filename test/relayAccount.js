// const rlp = require('rlp')
// const utils = require('ethereumjs-util')
// const h = require('./helpers')
// const EthProof = require('eth-proof')
// const Web3 = require('web3')
// const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))
// const ep = new EthProof(new Web3.providers.HttpProvider("https://rinkeby.infura.io"), "9cc20c925e71c1df0d409a6a25d9da2cb82ed3da95b76152a5082e0af35b5d47")

// const rbrelay = artifacts.require("./rbrelay.sol");
// const target = artifacts.require("./Target.sol");

// numToBuf = (input)=>{ return new Buffer(byteable(input.toString(16)), 'hex') }
// stringToBuf = (input)=>{ input=input.slice(2); return new Buffer(byteable(input), 'hex') }
// byteable = (input)=>{ return input.length % 2 == 0 ? input : '0' + input }

// var block = web3.eth.getBlock(617591,true);
// var encoded, blockHash;
// if(block != null) {
//   var hash = block["hash"];

//   var blockBytes = [];
//   var unsignedBlockBytes = [];
//   var r, s, v;

//   var headerFields = ["parentHash","sha3Uncles","miner","stateRoot","transactionsRoot",
//   "receiptsRoot","logsBloom","difficulty","number","gasLimit","gasUsed","timestamp",
//   "extraData","mixHash","nonce"];
  
//   for(var j=0; j<headerFields.length; j++) {
//     if(headerFields[j]=="difficulty") {
//       var fieldBuf = numToBuf(block[headerFields[j]].toNumber());
//     } else if(typeof block[headerFields[j]]=='number') {
//       var fieldBuf = numToBuf(block[headerFields[j]]);
//       if(block[headerFields[j]]==0) {
//         fieldBuf = new Buffer('');
//       }
//     }

//     if(typeof block[headerFields[j]]=='string') {
//       //console.log(typeof block[headerFields[j]]);
//       var fieldBuf = stringToBuf(block[headerFields[j]]);
//     }
//     //console.log(fieldBuf);
//     blockBytes.push(fieldBuf);
//   }
//   // console.log(unsignedBlockBytes);
//   encoded = '0x'+rlp.encode(blockBytes).toString('hex')
//   blockHash = "0x" + utils.sha3(rlp.encode(blockBytes)).toString('hex');
// }

// contract('rbrelay', function(accounts) {
//   var rb, t, proof;

//   it("should set everything up correctly", function(done) {
//     ep.getAccountProof('0x42EB768f2244C8811C63729A21A3569731535f06').then(function(result) {
//       console.log(result);
//       proof = h.web3ify(result);
//     }).then(function() {
//       return rbrelay.deployed();
//     }).then(function(instance) {
//       rb = instance;
//       return rb.startHash.call();
//     }).then(function(result) {
//       console.log("\nstart hash: " + result + "\n");
//       assert.equal(result, "0x9cc20c925e71c1df0d409a6a25d9da2cb82ed3da95b76152a5082e0af35b5d47", "start hash incorrect");
//     }).then(function() {
//       return target.deployed();
//     }).then(function(instance) {
//       t = instance;
//       return t.accountDone.call();
//     }).then(function(result) {
//       console.log("done:\n" + JSON.stringify(result) + "\n");
//       assert.isFalse(result, "done is not false");
//     }).then(function() {
//       done();
//     });
//   })

//   it("should store block 617591", function(done) {
//     rb.storeBlockHeader(encoded).then(function(result) {
//       console.log("\nstoreBlockHeader:\n" + JSON.stringify(result) + "\n");
//     }).then(function() {
//       return rb.rbchain.call(blockHash)
//     }).then(function(result) {
//       assert.equal(parseInt(result), 617591, "header 617591 was not stored correctly");
//     }).then(function() {
//       done();
//     })
//   })

//   it("should relay tx 0x0901fd2fa414594b57b512983764ba66cb33d534d0048f60d796f1ef5c3e04f6", function(done) {
//     rb.relayAccount(proof.value, proof.path, proof.parentNodes, encoded, t.address).then(function(result) {
//       console.log("\nrelayAccount:\n" + JSON.stringify(result) + "\n");
//     }).then(function() {
//       return t.accountDone.call();
//     }).then(function(result) {
//       console.log("done:\n" + JSON.stringify(result) + "\n");
//       assert.isTrue(result, "done is not true");
//     }).then(function() {
//         done();
//     })
//   })
// })
