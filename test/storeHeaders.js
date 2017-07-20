const rlp = require('rlp')
const asyncLoop = require('node-async-loop');
const rbrelay = artifacts.require("./rbrelay.sol");

const genesisHash = '0x6341fd3daf94b748c72ced5a5b26028f2474f5f00d824504e4fa37a75767e177'

contract('rbrelay', function(accounts) {
	var rb

	it("should have the header of the geneis block stored already", function(done) {
		const stateRoot = '0x53580584816f617295ea26c0e17641e0120cab2f0a8ffb53a866fd53aa8e8c2d'
		const transactionsRoot = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
		const receiptsRoot = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
		var sr, tr, rr
		rbrelay.deployed().then(function(instance) {
			rb = instance
			return rb.getStateRoot.call(genesisHash)
		}).then(function(result) {
			sr = result
			return rb.getTransactionsRoot.call(genesisHash)
		}).then(function(result) {
			tr = result
			return rb.getReceiptsRoot.call(genesisHash)
		}).then(function(result) {
			rr = result

			assert.equal(sr, stateRoot, "genesis state root did not match")
			assert.equal(tr, transactionsRoot, "genesis transactions root did not match")
			assert.equal(rr, receiptsRoot, "genesis receipts root did not match")
		}).then(function() {
			done()
		})
	})

	var a = []
	for(var i=1; i<=10; i++) {
		a.push(i)
	}
	asyncLoop(a, function(item,next) {
		it("should store header of block number "+item, function(done) {
			rbrelay.deployed().then(function(instance) {
				rb = instance
				
			})
		})
	}, function(err) {
		if (err) {
	        console.error('Error: ' + err.message);
	        return;
	    }
	})
})