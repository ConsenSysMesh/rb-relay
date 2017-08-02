#! /usr/bin/env node

const pkg = require("./package.json");
const rlp = require('rlp');
const Web3 = require('web3')
const EthProof = require('eth-proof');
const Contract = require('truffle-contract');
const rinkebyWeb3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))
const ropstenWeb3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"))
const ep = new EthProof(new Web3.providers.HttpProvider("https://rinkeby.infura.io"));
const Rbrelay = require('./build/rbrelay.json');

const args = process.argv.slice(2);
const command = args[0];


switch(command) {
  case "version":
    console.log(pkg.version);
    break;
  case "start":
    relay()
  default:
    console.log("Usage: <command> <options>");
}


var rinkebyLatestBlockNum = 0
var relayLatestBlockNum = 0


function relay(){
  Rbrelay = 
    setInterval(rinkebyGetLatestBlock, 2500);
  // setInterval(RbGetBlockNum, 2500);
}


function rinkebyGetLatestBlock() {
  rinkebyWeb3.getBlock("latest", (err,result) => {
    if(result.toNumber() != rinkebyLatestBlock) {
      rinkebyLatestBlock = result;
    }
  })
}

function RelayGetLatestBlock() {
  rinkebyWeb3.getBlock("latest", (err,result) => {
    if(result != latestBlock) {
      latestBlock = result;
    }
  })
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
