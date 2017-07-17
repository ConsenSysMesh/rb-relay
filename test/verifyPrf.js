const rlp = require('rlp');
const proof = require('merkle-patricia-proof');

var rbrelay = artifacts.require("./rbrelay.sol");

contract('rbrelay', function(accounts) {
  let rb
  rbrelay.deployed().then(function(instance) {
    rb = instance;
  }).catch(function(e) {
    throw new Error(e);
  })

  it("should verify tx 0xb53f752216120e8cbe18783f41c6d960254ad59fac16229d4eaec5f7591319de", function() {
    rb.truth.call()
    .then((result) => assert.equal(result, true))
  })
})
