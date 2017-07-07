const Web3 = require(`web3`);
var contract = require("truffle-contract");
var rlp = require('rlp');
var utils = require('ethereumjs-util')
var fs = require('fs');
var asyncLoop = require('node-async-loop');
var HDWalletProvider = require("truffle-hdwallet-provider");

var secrets;
var mnemonic;
if(fs.existsSync("secrets.json")) {
  secrets = JSON.parse(fs.readFileSync("secrets.json", "utf8"));
  mnemonic = secrets.mnemonic;
} else {
  console.log("no secrets.json found. You can only deploy to the testrpc.");
  mnemonic = "" ;
}

const rinkebyWeb3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/hIIhvL77mY5xhwgaqRmz"));
// var rpcWeb3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

var rbrelay_json = JSON.parse(fs.readFileSync("build/contracts/rbrelay.json", "utf8"));
var rbrelay = contract(rbrelay_json);

var provider = new HDWalletProvider(mnemonic, "https://kovan.infura.io/hIIhvL77mY5xhwgaqRmz");
rbrelay.setProvider(provider);
rbrelay.setNetwork(42);

numToBuf = (input)=>{ return new Buffer(byteable(input.toString(16)), 'hex') }
stringToBuf = (input)=>{ input=input.slice(2); return new Buffer(byteable(input), 'hex') }
byteable = (input)=>{ return input.length % 2 == 0 ? input : '0' + input }

var startBlockNumber = 0;
var maxBlockNumber = 449300;

var a = [];
for(var i=startBlockNumber; i<=maxBlockNumber; i++) {
	a.push(i);
}

var l;
var rb;
rbrelay.deployed().then(function(instance) {
	rb = instance;
	return rb.latest.call({from:provider.getAddress()});
}).then(function(latest) {
	l = parseInt(latest);
	l++;
}).catch(function(e) {
	throw new Error(e);
}).then(function() {
	asyncLoop(a, function(item, next) {
		var block = rinkebyWeb3.eth.getBlock(l,true);

		if(block != null) {
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
			/*console.log("unsigned:");
			console.log(utils.sha3(rlp.encode(unsignedBlockBytes)).toString('hex'));
			console.log("signed:");
			console.log(utils.sha3(rlp.encode(blockBytes)).toString('hex'));*/
			var unsignedHash = "0x" + utils.sha3(rlp.encode(unsignedBlockBytes)).toString('hex');
			var signedHash = "0x" + utils.sha3(rlp.encode(blockBytes)).toString('hex');
			
			console.log(rbrelay.isDeployed());
			rbrelay.deployed().then(function(instance) {
				rb = instance;
				console.log("almost there!");
				return rb.storeBlockHeader(parentHash,stateRoot,transactionsRoot,
					receiptsRoot,blockNumber,r,s,v,unsignedHash,signedHash,{/*nonce: n,*/ from:provider.getAddress(), gas: 4000000, gasPrice: 10000000000});
			}).then(function(value) {
				console.log(l/*a[i]*/);
			 	l++;
			}).catch(function(e) {
				throw new Error(e);
			}).then(next);
		}
	}, function (err) {
	    if (err) {
	        console.error('Error: ' + err.message);
	        return;
	    }
	});
});

/*
rbrelay.deployed().then(function(instance) {rb=instance;return rb.storeBlockHeader("0x0000000000000000000000000000000000000000000000000000000000000000","0x53580584816f617295ea26c0e17641e0120cab2f0a8ffb53a866fd53aa8e8c2d","0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421","0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",0,"0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000",0,"0x468299f8ae3ca255b24078c25564581d49f5ead8fcdfbdc9f1bdce0fd699494e","0x6341fd3daf94b748c72ced5a5b26028f2474f5f00d824504e4fa37a75767e177",{from:provider.getAddress()}); }).then(function(value) {console.log("success")}).catch(function(e) {console.log("failure!"); throw new Error(e); })
*/