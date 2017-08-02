#! /usr/bin/env node

const pkg = require("./package.json");
const rlp = require('rlp');
const Web3 = require('web3')
const EthProof = require('eth-proof');
const Contract = require('truffle-contract');
const rinkebyWeb3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))
const ropstenWeb3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"))
const ep = new EthProof(new Web3.providers.HttpProvider("https://rinkeby.infura.io"));
const rbrelay = require('./build/contracts/rbrelay.json');

const args = process.argv.slice(2);
const command = args[0];
const option1 = args[1];
const option2 = args[2];

switch(command) {
  case "version":
    console.log(pkg.version);
    break;

  case "start":
    relay();
    break;

  case "tx":
    var hex = /0x[a-f0-9]{64}/i;
    if(!hex.test(option1) || option1.length != 68 ||
       !hex.test(option2) || option2.length != 40) {
      console.log("Usage: rbrelay tx [txHash] [targetAddr]");
      break;
    }
    relayTx(option1, option2);
    break;

  case "receipt":
    var hex = /0x[a-f0-9]{64}/i;
    if(!hex.test(option1) || option1.length != 68 ||
       !hex.test(option2) || option2.length != 40) {
      console.log("Usage: rbrelay receipt [txHash] [targetAddr]");
      break;
    }
    relayReceipt(option1, option2);
    break;
    
  default:
    console.log("Usage: rbrelay <command> <options>");
}


var rinkebyLatestBlockNum = 0
var relayLatestBlockNum = 0


function relay(){
  setInterval(rinkebyGetLatestBlock, 2500);
  // setInterval(RbGetBlockNum, 2500);
}


function rinkebyGetLatestBlock() {
  rinkebyWeb3.eth.getBlock("latest", (err,result) => {
    if(result.number != rinkebyLatestBlockNum) {
      rinkebyLatestBlockNum = result.number;
    }
    console.log(rinkebyLatestBlockNum);
  })
}

function RelayGetLatestBlock() {
  rinkebyWeb3.eth.getBlock("latest", (err,result) => {
    if(result.number != latestBlock) {
      latestBlock = result.number;
    }
  })
}

function relayTx(txHash, targetAddr) {
  const proof, rb;
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
  const proof, rb;
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
