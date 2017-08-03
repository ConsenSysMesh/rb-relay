#! /usr/bin/env node

const pkg = require("./package.json");
const rlp = require('rlp');
const Web3 = require('web3');
const Contract = require('truffle-contract');
const EthProof = require('eth-proof');
const ep = new EthProof(new Web3.providers.HttpProvider("https://rinkeby.infura.io/"));

const args = process.argv.slice(2);
const command = args[0];
const option1 = args[1];
const option2 = args[2];
const hex = /0x[a-f0-9]{64}/i;

const rinkebyWeb3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/"));
const ropstenWeb3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/"));

const fs = require('fs');
var secrets;
var mnemonic;
if(fs.existsSync("secrets.json")) {
  secrets = JSON.parse(fs.readFileSync("secrets.json", "utf8"));
  mnemonic = secrets.mnemonic;
} else {
  console.log("no secrets.json found. You can only deploy to the testrpc.");
  mnemonic = "" ;
}

const HDWalletProvider = require("truffle-hdwallet-provider");
const Rbrelay = require('./build/contracts/rbrelay.json');
const rbrelay = Contract(Rbrelay);
const provider = new HDWalletProvider(mnemonic, "https://ropsten.infura.io/");
rbrelay.setProvider(provider);

var rinkebyLatestBlock, relayLatestBlock;

switch(command) {
  case "version":
    console.log(pkg.version);
    break;

  case "start":
    relay();
    break;

  case "tx":
    if(!checkOptions(option1, option2, 0)) {
      break;
    }
    relayTx(option1, option2);
    break;

  case "receipt":
    if(!checkOptions(option1, option2, 1)) {
      break;
    }
    relayReceipt(option1, option2);
    break;
    
  default:
    console.log("Usage: rbrelay <command> <options>");
}


function relay() {
  setInterval(storeHeader, 2500);
  // setInterval(RbGetBlockNum, 2500);
}

function storeHeader() {
  return new Promise((resolve, reject) => {
    var rb, header;
    rbrelay.deployed().then(function(instance) {
      rb = instance;
      return rb.head.call();
    }).then(function(result) {
      return rb.rbchain.call(result);
    }).then(function(result) {
      relayLatestBlock = parseInt(result);
    });
  });
}

function constructHeader(blockNum) {
  return new Promise((resolve, reject) => {
    var encoded;

    var block = rinkebyWeb3.eth.getBlock(blockNum, true, (err, result) => {
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
            var fieldBuf = stringToBuf(block[headerFields[j]]);
          }
          blockBytes.push(fieldBuf);
        }
        encoded = '0x'+rlp.encode(blockBytes).toString('hex')
      }

      resolve(encoded);
    });
  });
}

function rinkebyGetLatestBlock() {
  return new Promise((resolve, reject) => {
    rinkebyWeb3.eth.getBlock("latest", (err,result) => {
      if(result.number != rinkebyLatestBlock) {
        rinkebyLatestBlock = result.number;
      }
      resolve(result.number);
    });
  });
}

function relayGetLatestBlock(rb) {
  return new Promise((resolve, reject) => {
    rinkebyWeb3.eth.getBlock("latest", (err,result) => {
      var rblatest = result;
      rb.head.call().then(function(result) {
        return rb.rbchain.call(result);
      }).then(function(result) {
        relayLatest = parseInt(result);
        if(relayLatest < rblatest) {
          relayLatestBlock = relayLatest + 1;
        }
      })

      resolve(relayLatestBlock);
    });
  });
}

function relayTx(txHash, targetAddr) {
  var proof, rb;
  ep.getTransactionProof(txHash).then(function(result) {
    proof = web3ify(result);
  }).then(function() {
    return rbrelay.deployed();
  }).then(function(instance) {
    rb = instance;
  }).then(function() {
    rb.relayTx(proof.value, proof.path, proof.parentNodes, proof.header, targetAddr);
  });
}

function relayReceipt(receipt, targetAddr) {
  var proof, rb;
  ep.getReceiptProof(receipt).then(function(result) {
    proof = web3ify(result);
  }).then(function() {
    return rbrelay.deployed();
  }).then(function(instance) {
    rb = instance;
  }).then(function() {
    rb.relayTx(proof.value, proof.path, proof.parentNodes, proof.header, targetAddr);
  });
}

function checkOptions(option1, option2, id) {
  if(!hex.test(option1) || option1.length != 68 ||
     !hex.test(option2) || option2.length != 40) {
    console.log("Usage: rbrelay " + id==0?"tx":"receipt" + " [txHash] [targetAddr]");
    return false;
  }
  return true;
}

function web3ify(input) {
  output = {}
  output.value = '0x' + rlp.encode(input.value).toString('hex')
  output.header = '0x' + rlp.encode(input.header).toString('hex')
  output.path = input.path.toString('hex')
  output.path = (output.path.length%2==0 ? '0x00' : '0x1') + output.path
  output.parentNodes = '0x' + rlp.encode(input.parentNodes).toString('hex')
  output.txRoot = '0x' + input.header[4].toString('hex')
  output.blockHash = '0x' + input.blockHash.toString('hex')
  return output
}
