const asyncLoop = require('node-async-loop');
const Web3 = require(`web3`);
const rlp = require('rlp');
const utils = require('ethereumjs-util')
const rbrelay = artifacts.require("./rbrelay.sol");

const rinkebyWeb3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/hIIhvL77mY5xhwgaqRmz"));

numToBuf = (input)=>{ return new Buffer(byteable(input.toString(16)), 'hex') }
stringToBuf = (input)=>{ input=input.slice(2); return new Buffer(byteable(input), 'hex') }
byteable = (input)=>{ return input.length % 2 == 0 ? input : '0' + input }

const genesisHash = '0x6341fd3daf94b748c72ced5a5b26028f2474f5f00d824504e4fa37a75767e177'

contract('rbrelay', function(accounts) {
	var rb;
	var block = rinkebyWeb3.eth.getBlock(2,true);

	if(block != null) {
		var hash = block["hash"];

		var blockBytes = [];
		var unsignedBlockBytes = [];
		var r, s, v;

		var headerFields = ["parentHash","sha3Uncles","miner","stateRoot","transactionsRoot",
		"receiptsRoot","logsBloom","difficulty","number","gasLimit","gasUsed","timestamp",
		"extraData","mixHash","nonce"];
		
		for(var j=0; j<headerFields.length; j++) {
			if(headerFields[j]=="difficulty") {
				var fieldBuf = numToBuf(block[headerFields[j]].toNumber());
			} else if(typeof block[headerFields[j]]=='number') {
				var fieldBuf = numToBuf(block[headerFields[j]]);
				if(block[headerFields[j]]==0) {
					fieldBuf = new Buffer('');
				}
			}

			if(typeof block[headerFields[j]]=='string') {
				//console.log(typeof block[headerFields[j]]);
				var fieldBuf = stringToBuf(block[headerFields[j]]);
			}
			//console.log(fieldBuf);
			blockBytes.push(fieldBuf);

			if(headerFields[j]=="extraData") {
				var sig = fieldBuf.slice(-65);
				//console.log("r:");
				r = "0x" + sig.slice(0,32).toString('hex');
				//console.log("s:");
				s = "0x" + sig.slice(32,64).toString('hex');
				//console.log("v:");
				// add 27 cuz of some bug
				v = parseInt(sig.slice(64,65).toString('hex'))+27;

				fieldBuf = fieldBuf.slice(0,-65);
			}
			unsignedBlockBytes.push(fieldBuf);
		}
		// console.log(unsignedBlockBytes);
		var signedBytes = "0x"+rlp.encode(blockBytes).toString('hex')
		var unsignedHash = "0x" + utils.sha3(rlp.encode(unsignedBlockBytes)).toString('hex');
		var blockHash = "0x" + utils.sha3(rlp.encode(blockBytes)).toString('hex');

		console.log("r: "+r);
		console.log("s: "+s);
		console.log("v: "+v);
		console.log("unsigned hash: "+unsignedHash);
		console.log("block hash: "+blockHash);
		console.log("signed bytes: "+signedBytes);
		//console.log("["+hexToBytes(encoded).toString()+"], \""+r+"\", \""+s+"\", "+v+", \""+blockHash+"\"");
	}

	rbrelay.deployed().then(function(instance) {
		rb = instance;
		return rb.storeBlockHeader(signedBytes)
	}).then(function(result) {
		console.log(result);
	})
	// it("should have the header of the geneis block stored already", function(done) {
		
	// })

	// var a = []
	// for(var i=1; i<=10; i++) {
	// 	a.push(i)
	// }
	// asyncLoop(a, function(item,next) {
	// 	it("should store header of block number "+item, function(done) {
	// 		rbrelay.deployed().then(function(instance) {
	// 			rb = instance
				
	// 		})
	// 	})
	// }, function(err) {
	// 	if (err) {
	//         console.error('Error: ' + err.message);
	//         return;
	//     }
	// })
})