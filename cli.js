#! /usr/bin/env node

const pkg = require("./package.json");
const rlp = require('rlp');
const Web3 = require('web3');
// const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/"))
const Contract = require('truffle-contract');
const EthProof = require('eth-proof');
const chalk = require('chalk');

const ep = new EthProof(new Web3.providers.HttpProvider("https://rinkeby.infura.io/"));

const args = process.argv.slice(2);
const command = args[0];
const option1 = args[1];
const option2 = args[2];
const hex = /0x[a-f0-9]/i;

var nonce;
var relayNextNum;
var txInGroup = {};
var newRelayGroup;
var txSent = {};
var intervalID;
var rb;
var rbt;
var gasPrice = 25000000000;
var rinkebyHead;
var newRinkebyHead = false;
var relayHeadNum;
var newRelayHeadNum = true;
var coinbaseETH;
var startTime = new Date();


const numToBuf = (input)=>{ return new Buffer(byteable(input.toString(16)), 'hex') }
const stringToBuf = (input)=>{ input=input.slice(2); return new Buffer(byteable(input), 'hex') }
const byteable = (input)=>{ return input.length % 2 == 0 ? input : '0' + input }

const rinkebyWeb3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/"));
const relayWeb3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/"));

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
const Rb20 = Contract(require('./build/contracts/rb20.json'))
const Rbrelay = Contract(require('./build/contracts/rbrelay.json'))
const relayProvider = new HDWalletProvider(mnemonic, "https://ropsten.infura.io/");
Rbrelay.setProvider(relayProvider)
Rb20.setProvider(relayProvider)


// var rinkebyLatestBlock, relayLatestBlock;  

switch(command) {
  case "version":
    console.log(pkg.version);
    break;

  case "start":
    console.log("Doing something awesome...")
    initVars().then(relay);
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

function checkOptions(option1, option2, id) {
  if(!hex.test(option1) || option1.length != 66 ||
     !hex.test(option2) || option2.length != 42) {
    console.log("Usage: rbrelay " + (id==0?"tx":"receipt") + " [txHash] [targetAddr]");
    return false;
  }
  return true;
}

function initVars(){
  return new Promise ((accept, reject) => {
    Rbrelay.deployed().then(function(instance) {
      rb = instance;
      return rb.head.call();
    }).then(function(_headHash) {
      // console.log("HEAD: ", result)
      return rb.rbchain.call(_headHash);
    }).then(function(_headNum) {
      startRelayHeadNum = parseInt(_headNum)
      relayHeadNum = startRelayHeadNum
      relayNextNum = relayHeadNum + 1;
      return rb.rb20.call()
    }).then((_rb20Address)=>{

      relayWeb3.eth.getBalance(relayProvider.getAddress(), function(e,r){
        coinbaseETH = Math.round(r/(relayWeb3.toWei(1,"ether")));
        rb20 = Rb20.at(_rb20Address)
        // console.log(rb20.address)
        renderInit()
        accept()
      })
      // get coinbase eth balance
      // rinkebyWeb3.eth.getBlock("latest", (err,result) => {


    })
  })
}

function renderInit(){
    console.log("RBT Address:\t", chalk.blue.bold(rb20.address))
    console.log("Relay Address:\t", chalk.yellow.bold(rb.address))
    console.log("Your Coinbase:\t", chalk.green.bold( relayProvider.getAddress()+" ETH: "+ coinbaseETH ))
}


function relay() {
  gasPrice++;
  relayWeb3.eth.getTransactionCount(relayProvider.getAddress(), function(e,_nonce){
    nonce = _nonce - 1;
    txSent = {};
    rb.rb20.call().then(function(result) {
    //   return rb.head.call();
    // }).then(function(result) {
    //   // console.log("HEAD: ", result)
    //   return rb.rbchain.call(result);
    // }).then(function(result) {
    //   // console.log("rbChain(HEAD): ", result)
    //   relayHeadNum = parseInt(result);
      relayNextNum = relayHeadNum + 1;
      // console.log("WHY:", relayNextNum, relayHeadNum)
      clearInterval(intervalID);
      intervalID = setInterval(storeLatestBlock, 2500);
    })
    .catch((err) => console.log(`THIS IS THE ERROR: `, err));
  })
}

function storeLatestBlock() {
  renderAll()
  try{
    rb.head.call().then(function(_head) {
      return rb.rbchain.call(_head);
    }).then(function(_headNum) {
      if(relayNextNum > parseInt(_headNum) + 5){
        newRelayGroup = false;
        relay();
      }else{
        rinkebyWeb3.eth.getBlock("latest", (err,result) => {
          if (rinkebyHead != parseInt(result.number)){
            rinkebyHead = parseInt(result.number);
            newRinkebyHead = true;
          }
          if(relayNextNum <= rinkebyHead && !txSent[relayNextNum]) {
            if(!txInGroup[relayNextNum]) {
              newRelayGroup = true;
              txInGroup[relayNextNum] = true;
            }
            constructHeader(relayNextNum).then(function(header){
              nonce++;
              txSent[relayNextNum] = true;
              relayNextNum++;
              return rb.storeBlockHeader(header, {nonce: nonce, gas: 250000, gasPrice: gasPrice, from: relayProvider.getAddress()});
            }).then(function(tx) {
              return rb.head.call();
            }).then((hash)=>{
              return rb.rbchain.call(hash);
            }).then(function(currentNumConfirmed) {
              relayHeadNum = currentNumConfirmed;
              newRelayHeadNum = true;
            }).catch((error)=>{})
          }
        })
      }
    });
  }catch(e){}
}

function renderAll(){
  var str = chalk.dim(new Date().toISOString()) + " \t";
  str += renderRinkebyBlockMined() + " \t";
  str += renderTxRequest() + " \t";
  str += renderConfirmation() + " \t";
  str += renderRelayRate() + " \t";
  console.log(str)
}
function renderRelayRate(){
  return (new Date() - startTime)/(1000*(relayHeadNum - startRelayHeadNum)) + " sec/headStored"
}


function renderTxRequest(){
  if(newRelayGroup){
    return chalk.white("Broadcasting:") + chalk.keyword('orange').bold(relayNextNum);
  }else{
    return chalk.white("Broadcasting:") + chalk.grey(relayNextNum);
  }
}
function renderConfirmation(){
  if(newRelayHeadNum){
    newRelayHeadNum = false;
    return  chalk.white("Relay Head: ") + chalk.green.bold(relayHeadNum)
  }else{
    return  chalk.white("Relay Head: ") + chalk.grey(relayHeadNum)
  }
}
function renderRinkebyBlockMined(){
  if(newRinkebyHead){
    newRinkebyHead = false
    return chalk.white("Rinkeby Head:    ") + chalk.red.bold(rinkebyHead)
  }else{
    return chalk.white("Rinkeby Head:    ") + chalk.grey(rinkebyHead)
  }
}


function constructHeader(blockNum) {
  return new Promise((resolve, reject) => {
    var encoded;
    rinkebyWeb3.eth.getBlock(blockNum, true, (err, result) => {
      var block = result;
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

function relayTx(txHash, targetAddr) {
  var proof, rb;
  ep.getTransactionProof(txHash).then(function(result) {
    proof = web3ify(result);
  }).then(function() {
    return Rbrelay.deployed();
  }).then(function(instance) {
    rb = instance;
    return rb.head.call();
  }).then(function(result) {
    return rb.rbchain.call(result);
  }).then(function(result) {
    if(proof.header.blockNumber > result) {
      console.log("tx is too recent");
    }
  }).then(function() {
    console.log("You are being charged 0.1 ether!!!");
    return rb.relayTx(proof.value, proof.path, proof.parentNodes, proof.header, targetAddr, {gas: 2000000, gasPrice: 25000000000, value: relayWeb3.toWei(0.1,'ether'), from: relayProvider.getAddress()});
  }).then(function(result) {
    console.log(JSON.stringify(result));
  });
}

function relayReceipt(txHash, targetAddr) {
  var proof, rb;
  ep.getReceiptProof(txHash).then(function(result) {
    proof = web3ify(result);
  }).then(function() {
    return Rbrelay.deployed();
  }).then(function(instance) {
    rb = instance;
    return rb.head.call();
  }).then(function(result) {
    return rb.rbchain.call(result);
  }).then(function(result) {
    if(proof.header.blockNumber > result) {
      console.log("tx is too recent");
    }
  }).then(function() {
    console.log("You are being charged 0.1 ether!!!");
    return rb.relayReceipt(proof.value, proof.path, proof.parentNodes, proof.header, targetAddr, {gas: 200000, gasPrice: 25000000000, value: relayWeb3.toWei(0.1,'ether'), from: relayProvider.getAddress()});
  }).then(function(result) {
    console.log(JSON.stringify(result));
  });
}

var web3ify = (input) => {
  output = {}
  output.value = '0x' + rlp.encode(input.value).toString('hex')
  output.header = '0x' + rlp.encode(input.header).toString('hex')
  output.path = '0x00' + input.path.toString('hex')
  output.parentNodes = '0x' + rlp.encode(input.parentNodes).toString('hex')
  output.txRoot = '0x' + input.header[4].toString('hex')
  output.blockHash = '0x' + input.blockHash.toString('hex')
  return output
}
