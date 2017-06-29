const Web3 = require(`web3`);
var contract = require("truffle-contract");
var rlp = require('rlp');
var utils = require('ethereumjs-util')

//const ropstenWeb3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/hIIhvL77mY5xhwgaqRmz"));
const rinkebyWeb3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/hIIhvL77mY5xhwgaqRmz"));

var rbrelay = contract('build/contracts/rbrelay.json');
console.log(rbrelay.abi);
rbrelay.setProvider(new Web3.providers.HttpProvider("https://ropsten.infura.io/"));
console.log(rbrelay.currentProvider);

numToBuf = (input)=>{ return new Buffer(byteable(input.toString(16)), 'hex') }
stringToBuf = (input)=>{ input=input.slice(2); return new Buffer(byteable(input), 'hex') }
byteable = (input)=>{ return input.length % 2 == 0 ? input : '0' + input }

var i = 0;
while(true) {
	var block = rinkebyWeb3.eth.getBlock(i,true);
	if(block != null) {
		//console.log(block);
		var hash = block["hash"];

		var blockBytes = [];
		var unsignedBlockBytes = [];

		var headerFields = ["parentHash","sha3Uncles","miner","stateRoot","transactionsRoot",
		"receiptsRoot","logsBloom","difficulty","number","gasLimit","gasUsed","timestamp",
		"extraData","mixHash","nonce"];

		var parentHash = block[headerFields[0]];
		var stateRoot = block[headerFields[3]];
		var transactionsRoot = block[headerFields[4]];
		var receiptsRoot = block[headerFields[5]];
		var blockNumber = block[headerFields[8]];
		var r, s, v;
		
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
				var sig = fieldBuf.slice(32);
				//console.log("r:");
				r = sig.slice(0,32).toString('hex');
				//console.log("s:");
				s = sig.slice(32,64).toString('hex');
				//console.log("v:");
				// add 27 cuz of some bug
				v = parseInt(sig.slice(64,65).toString('hex'))+27;

				fieldBuf = fieldBuf.slice(0,-65);
			}
			unsignedBlockBytes.push(fieldBuf);
		}
		/*console.log("unsigned:");
		console.log(utils.sha3(rlp.encode(unsignedBlockBytes)).toString('hex'));
		console.log("signed:");
		console.log(utils.sha3(rlp.encode(blockBytes)).toString('hex'));*/
		//console.log(blockBytes);
		//var encoded = rlp.encode(blockBytes);
		var unsignedHash = utils.sha3(rlp.encode(unsignedBlockBytes)).toString('hex');
		var signedHash = utils.sha3(rlp.encode(blockBytes)).toString('hex');
		console.log(rbrelay.isDeployed());
		var rb;
		rbrelay.at("0x3fac69f15bff47cbd3ebd7761ce2079c2c5f20ac").then(function(instance) {
			rb = instance;
			console.log("almost there!");
			return rb.storeBlockHeader(parentHash,stateRoot,transactionsRoot,
				receiptsRoot,blockNumber,r,s,v,unsignedHash,signedHash,{from:ropstenWeb3.accounts[0]});
		}).then(function(value) {
			console.log(i);
		 	i++;
		}).catch(function(e) {
			throw new Error(e);
		});
	}
}

// function hexStrToByteArray(hexStr) {
// 	hexStr = hexStr.slice(2); // remove 0x

// 	if(hexStr.length%2!=0) {
// 		hexStr = "0" + hexStr;
// 	}

// 	var bytesLength = hexStr.length/2

// 	var byteArray = new Uint8Array(bytesLength);

// 	for(var i=0; i<bytesLength; i++) {
// 	    var sum = 0;
	    
// 	    var first = hexStr.charCodeAt(i);
// 	    if(first<97) {
// 	        sum += 16*(first-48);
// 	    } else {
// 	        sum += 16*(first-87);
// 	    }
	    
// 	    var second = hexStr.charCodeAt(i+1);
// 	    if(second<97) {
// 	        sum += second-48;
// 	    } else {
// 	        sum += second-87;
// 	    }

// 	    byteArray[i] = sum;
// 	}

// 	return byteArray;
// }