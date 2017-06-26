const Web3 = require(`web3`);
var contract = require("truffle-contract");
var RLP = require('rlp');

const ropstenWeb3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/hIIhvL77mY5xhwgaqRmz"));
const rinkebyWeb3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/hIIhvL77mY5xhwgaqRmz"));

var rbrelay = contract('build/contracts/rbrelay.json');
rbrelay.setProvider(ropstenWeb3.currentProvider);

var i = 0;
while(true) {
	var result = rinkebyWeb3.eth.getBlockByNumber(i);
	if(result != null) {
		var block = result.result;
		var blockBytes = [];

		var headerFields = ["parentHash","sha3Uncles","miner","stateRoot","transactionsRoot",
		"receiptsRoot","logsBloom","difficulty","number","gasLimit","gasUsed","timestamp",
		"extraData","mixHash","nonce"];
		
		for(var j=0; j<headerFields.length; j++) {
			var fieldStr = block[headerFields[j]];
			var fieldByteArray = hexStrToByteArray(fieldStr);
			blockBytes.push(fieldByteArray);
		}
		var encoded = RLP.encode(blockBytes);

		var rb;
		rbrelay.deployed().then(function(instance) {
			rb = instance;
			return rb.storeBlockHeader(encoded);
		}).then(function(value) {
			i++;
		}).catch(function(e) {
			throw new Error(e);
		});
	}
}

function hexStrToByteArray(hexStr) {
	hexStr = hexStr.slice(3); // remove 0x

	if(hexStr.length%2!=0) {
		hexStr = "0" + hexStr;
	}

	var bytesLength = hexStr.length/2

	var byteArray = new Uint8Array(bytesLength);

	for(var i=0; i<bytesLength; i++) {
	    var sum = 0;
	    
	    var first = hexStr.charCodeAt(i);
	    if(first<97) {
	        sum += 16*(first-48);
	    } else {
	        sum += 16*(first-87);
	    }
	    
	    var second = hexStr.charCodeAt(i+1);
	    if(second<97) {
	        sum += second-48;
	    } else {
	        sum += second-87;
	    }

	    byteArray[i] = sum;
	}

	return byteArray;
}