const rlp = require('rlp')
const sha3 = require('sha3')
const utils = require('ethereumjs-util')
const h = require('./helpers')
const EthProof = require('eth-proof')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))
const ep = new EthProof(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))

const Rbrelay = artifacts.require("./rbrelay.sol");
const Target = artifacts.require("./Target.sol");

contract('Rbrelay', function(accounts) {
  var rb, t, startHeadNum, tx0, startHash;

  before(function(done){
    //setup
    Rbrelay.deployed().then(function(instance) {
      rb = instance;
      return rb.startHash.call();
    }).then(function(_startHash) {
      startHash = _startHash
      return rb.rbchain.call(_startHash)
    }).then(function(_headNum) {
      startHeadNum = parseInt(_headNum);
      return Target.deployed();
    }).then(function(instance) {
      t = instance;
      return t.numReceiptsProcessed.call();
    }).then(function(result) {
      assert.equal(parseInt(result), 0, "done is not false");
    }).then(function() {
      web3.eth.getBlock(startHeadNum, false, function(e,r){
        tx0 = r.transactions[0]
        tx1 = r.transactions[1]
        assert.isTrue(tx0 != undefined, "genesis block must have at least 2 tx in order for tests to pass")
        assert.isTrue(tx1 != undefined, "genesis block must have at least 2 tx in order for tests to pass")
        done();
      })
    });
  })


  it("should not store block prior to start header because genesis is defined starting there", function(done) {
    h.getRinkebyHeader(startHeadNum -1 , web3).then(function(headerString) {
      return rb.storeBlockHeader(headerString, {gas: 200000, gasPrice: 20000000000})
    }).then(function() {
      assert.isTrue(false, "should throw error while trying to storeBlockHeader")
    }).catch((e)=>{ done() })
  })

  it("should store the next block", function(done) {
    var headerString;
    h.getRinkebyHeader(startHeadNum+1, web3).then(function(_headerString) {
      headerString = _headerString
      // console.log(headerString)
      return rb.storeBlockHeader(headerString)
    }).then(function() {
      return rb.head.call()
    }).then(function(result) {
      assert.equal(parseInt(result), "0x" + utils.sha3(Buffer.from(headerString.slice(2),'hex')).toString('hex'), "header 617592 was not stored correctly");
    }).then(function() {
      done();
    })
  })

  it("should not store the same block twice", function(done) {
    h.getRinkebyHeader(startHeadNum+1, web3).then(function(headerString) {
      return rb.storeBlockHeader(headerString)
    }).catch((e)=>{ done() })
  })


  it("should relay receipt for tx0", function(done) {
    var proof;
    ep.getReceiptProof(tx0).then(function(result) {
      proof = h.web3ify(result);
      // console.log("\nrelayReceipt:\n" + JSON.stringify(result) + "\n");
      return rb.relayReceipt(proof.value, proof.path, proof.parentNodes, proof.header, t.address, {value: web3.toWei(0.1,'ether')})
    }).then(function() {
      return t.numReceiptsProcessed.call();
    }).then(function(result) {
      assert.equal(parseInt(result), 1, "should see a receipt processed");
    }).then(function() {
      done();
    })
  })
  it("should relay receipt for tx1", function(done) {
    var proof;
    ep.getReceiptProof(tx1).then(function(result) {
      proof = h.web3ify(result);
      // console.log("\nrelayReceipt:\n" + JSON.stringify(result) + "\n");
      return rb.relayReceipt(proof.value, proof.path, proof.parentNodes, proof.header, t.address, {value: web3.toWei(0.1,'ether')})
    }).then(function() {
      return t.numReceiptsProcessed.call();
    }).then(function(result) {
      assert.equal(parseInt(result), 2, "2 should have been processed");
    }).then(function() {
      done();
    })
  })
  it("should not relay receipt for a tx confirmed prior to genesis", function(done) {
    ep.getReceiptProof("0x12846ce31d3c83ab677b8c18affe0207774c16d774efe32868848bf69c511be5").then(function(result) {
      var proof = h.web3ify(result);
      return rb.relayReceipt(proof.value, proof.path, proof.parentNodes, proof.header, t.address, {value: web3.toWei(0.1,'ether')})
    }).catch(function() {
      return t.numReceiptsProcessed.call();
    }).then(function(result) {
      assert.equal(parseInt(result), 2, "should not have processed this receipt (3rd)");
      done();
    })
  })

  it("should relay tx0", function(done) {
    var proof;
    ep.getTransactionProof(tx0).then(function(result) {
      proof = h.web3ify(result);
      return rb.relayTx(proof.value, proof.path, proof.parentNodes, proof.header, t.address, {value: web3.toWei(0.1,'ether')})
    }).then(function() {
      return t.numTransactionsProcessed.call();
    }).then(function(result) {
      assert.equal(parseInt(result), 1, "should see a tx processed");
    }).then(function() {
      done();
    })
  })
  it("should relay tx1", function(done) {
    var proof;
    ep.getTransactionProof(tx1).then(function(result) {
      proof = h.web3ify(result);
      return rb.relayTx(proof.value, proof.path, proof.parentNodes, proof.header, t.address, {value: web3.toWei(0.1,'ether')})
    }).then(function() {
      return t.numTransactionsProcessed.call();
    }).then(function(result) {
      assert.equal(parseInt(result), 2, "should see a tx processed");
    }).then(function() {
      done();
    })
  })
  it("should not relay a tx confirmed prior to genesis", function(done) {
    ep.getTransactionProof("0x12846ce31d3c83ab677b8c18affe0207774c16d774efe32868848bf69c511be5").then(function(result) {
      var proof = h.web3ify(result);
      return rb.relayTx(proof.value, proof.path, proof.parentNodes, proof.header, t.address, {value: web3.toWei(0.1,'ether')})
    }).catch(function() {
      return t.numTransactionsProcessed.call();
    }).then(function(result) {
      assert.equal(parseInt(result), 2, "should not have processed this receipt (3rd)");
      done();
    })
  })

})
