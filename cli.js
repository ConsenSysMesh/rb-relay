#! /usr/bin/env node

const pkg = require("./package.json");
const rlp = require('rlp');
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))
const EthProof = require('eth-proof');
const ep = new EthProof(new Web3.providers.HttpProvider("https://rinkeby.infura.io"));

const args = process.argv.slice(2);
const command = args[0];

var latestBlock = 0 // inital block

const defaultMsg = "Usage: <command> <options>";
switch(command) {
	case "version":
    console.log(pkg.version);
    break;
  case "start":
    setInterval(readRbBlockNum, 2500);
  default:
    console.log(defaultMsg);
}

function readRbBlockNum() {
  web3.getBlock("latest", (err,result) => {
    if(result  latestBlock) {
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