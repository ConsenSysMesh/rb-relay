const Web3 = require(`web3`);
var rlp = require('rlp');
var utils = require('ethereumjs-util')
const EthProof = require('eth-proof')
const ep = new EthProof(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))

const rinkebyWeb3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/hIIhvL77mY5xhwgaqRmz"));

numToBuf = (input)=>{ return new Buffer(byteable(input.toString(16)), 'hex') }
stringToBuf = (input)=>{ input=input.slice(2); return new Buffer(byteable(input), 'hex') }
byteable = (input)=>{ return input.length % 2 == 0 ? input : '0' + input }

var block = rinkebyWeb3.eth.getBlock(1,true);

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
	var encoded = '0x'+rlp.encode(blockBytes).toString('hex')
	var unsignedHash = "0x" + utils.sha3(rlp.encode(unsignedBlockBytes)).toString('hex');
	//var blockHash = "0x" + utils.sha3(rlp.encode(blockBytes)).toString('hex');

	//console.log(r);
	console.log("unsigned hash: "+unsignedHash);
	console.log("signed bytes: ["+hexToBytes(encoded).toString('hex')+']');
	//console.log("["+hexToBytes(encoded).toString()+"], \""+r+"\", \""+s+"\", "+v+", \""+blockHash+"\"");
	var relayTx = "";
	ep.getTransactionProof('0x0901fd2fa414594b57b512983764ba66cb33d534d0048f60d796f1ef5c3e04f6').then(function(result) {
		var proof = web3ify(result)

		relayTx += "["+hexToBytes(proof.value).toString('hex')+"]"
		relayTx += ",["+hexToBytes(proof.path).toString('hex')+"]"
		relayTx += ",["+hexToBytes(proof.parentNodes).toString('hex')+"]"
		relayTx += ",["+hexToBytes(encoded).toString('hex')+"]"		 // headerBytes
		relayTx += ",\"0xC1ccbF167a8e1fada93DCa1B48587fD2780487c6\"" // targetAddr

		console.log("tx relay data:\n\n"+relayTx)
	})
}

function hexToBytes(hex) {
	hex = hex.slice(2);
	if(hex.length%2!=0) { hex = '0'+hex }

	var bytes = []
    for (var i = 0; i < hex.length/2; i++) {
    	bytes.push("\"0x"+hex.slice(2*i,2*i+2)+"\"");
    }
    return bytes;
}

function web3ify(input) {
  output = {}
  output.value = '0x' + rlp.encode(input.value).toString('hex')
  output.path = input.path.toString('hex')
  output.path = (output.path.length%2==0 ? '0x00' : '0x1') + output.path
  output.parentNodes = '0x' + rlp.encode(input.parentNodes).toString('hex')
  output.txRoot = '0x' + input.header[4].toString('hex')
  return output
}