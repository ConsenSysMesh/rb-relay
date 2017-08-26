#! /usr/bin/env node
const rlp      = require('rlp');
const Web3     = require('web3');
const EthProof = require('eth-proof');
const chalk    = require('chalk');

const Contract = require('truffle-contract');
const Rb20     = Contract(require('./build/contracts/rb20.json'))
const Rbrelay  = Contract(require('./build/contracts/rbrelay.json'))

module.exports = function serveHeaders(relayProvider){
  const rinkebyWeb3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/"));
  const relayWeb3 = new Web3(relayProvider);

  Rbrelay.setProvider(relayProvider)
  Rb20.setProvider(relayProvider)

  var nonce;
  var startRelayHeadNum
  var broadcastRelayHeadNum;
  var greatestBroadcastRelayHeadNum = 0;
  var txInGroup = {};
  var txSent = {};
  var intervalID;
  var rb;
  var rbt;
  var gasPrice = 25000000000;
  var rinkebyHead = 0;
  var greatestRinkebyHead = 0;
  var confirmedRelayHeadNum;
  var greatestConfirmedRelayHeadNum = 0;
  var coinbaseETH;
  var startTime = new Date();
  var rb20TotalSupply
  var rbBalance

  function initVars(){
    return new Promise ((accept, reject) => {
      Rbrelay.deployed().then(function(instance) {
        rb = instance;
        return rb.head.call();
      }).then(function(_headHash) {
        return rb.rbchain.call(_headHash);
      }).then(function(_startRelayHeadNum) {
        startRelayHeadNum = parseInt(_startRelayHeadNum)
        confirmedRelayHeadNum = startRelayHeadNum
        broadcastRelayHeadNum = confirmedRelayHeadNum + 1;
        return rb.rb20.call()
      }).then((_rb20Address)=>{
        rb20 = Rb20.at(_rb20Address)
        return rb20.totalSupply.call()
      }).then((_rb20TotalSupply)=>{
        rb20TotalSupply = parseInt(_rb20TotalSupply)
        // console.log(rb20TotalSupply)
      //   return rb.rb20.call()
      // }).then((_rb20Address)=>{
        
        relayWeb3.eth.getBalance(relayProvider.getAddress(), function(e,_coinbaseETH){
          coinbaseETH = Math.round(_coinbaseETH*100/(relayWeb3.toWei(1,"ether")))/100;
          relayWeb3.eth.getBalance(rb.address, function(e,_rbBalance){
            rbBalance = parseInt(_rbBalance)
            renderInit()
            accept()
          })
        })
        // get coinbase eth balance
        // rinkebyWeb3.eth.getBlock("latest", (err,result) => {


      })
    })
  }


  function relay() {
    gasPrice++;
    relayWeb3.eth.getTransactionCount(relayProvider.getAddress(), function(e,_nonce){
      nonce = _nonce - 1;
      txSent = {};
      rb.rb20.call().then(function(result) {
        broadcastRelayHeadNum = confirmedRelayHeadNum + 1;
        clearInterval(intervalID);
        intervalID = setInterval(storeLatestBlock, 2500);
      })
      .catch((err) => console.log(`THIS IS THE ERROR: `, err));
    })
  }

  function storeLatestBlock() {
    try{
      rb.head.call().then(function(_head) {
        return rb.rbchain.call(_head);
      }).then(function(_confirmedRelayHeadNum) {
        confirmedRelayHeadNum = parseInt(_confirmedRelayHeadNum) 
        if(broadcastRelayHeadNum > confirmedRelayHeadNum + 5){
          relay();
        }else{
          rinkebyWeb3.eth.getBlock("latest", (err,result) => {
            if (rinkebyHead != parseInt(result.number)){
              rinkebyHead = parseInt(result.number);
            }
            if(broadcastRelayHeadNum <= rinkebyHead && !txSent[broadcastRelayHeadNum]) {
              if(!txInGroup[broadcastRelayHeadNum]) {
                txInGroup[broadcastRelayHeadNum] = true;
              }
              constructHeader(broadcastRelayHeadNum).then(function(header){
                nonce++;
                txSent[broadcastRelayHeadNum] = true;
                broadcastRelayHeadNum++;
                return rb.storeBlockHeader(header, {nonce: nonce, gas: 250000, gasPrice: gasPrice, from: relayProvider.getAddress()});
              }).then(function(tx) {
              //   return rb.head.call();
              // }).then((hash)=>{
              //   return rb.rbchain.call(hash);
              // }).then(function(_confirmedRelayHeadNum) {
              //   confirmedRelayHeadNum = parseInt(_confirmedRelayHeadNum);
              }).catch((error)=>{})
            }
          })
        }
      });
    renderRelay()
    }catch(e){}
  }


  function renderInit(){
      console.log("RB20  Address:\t", chalk.blue.bold(rb20.address + "\tTotal Supply: " + rb20TotalSupply))
      console.log("Relay Address:\t", chalk.yellow.bold(rb.address + "\tETH: " + rbBalance))
      console.log("Your Coinbase:\t", chalk.green.bold( relayProvider.getAddress()+"\tETH: "+ coinbaseETH ) + "\n")
  }
  function renderRelay(){
    var str = chalk.dim(new Date().toISOString()) + " \t";
    str += renderRinkebyBlockMined() + " \t";
    str += renderBroadcast() + " \t";
    str += renderConfirmation() + " \t";
    str += renderRelayRate() + " \t";
    console.log(str)
  }
  function renderRelayRate(){
    return Math.round((new Date() - startTime)/(10*(confirmedRelayHeadNum - startRelayHeadNum)))/100 + " sec/headStored"
  }
  function renderBroadcast(){
    if(greatestBroadcastRelayHeadNum < broadcastRelayHeadNum){
      greatestBroadcastRelayHeadNum = broadcastRelayHeadNum;
      return chalk.white("Broadcasting: ") + chalk.keyword('orange').bold(broadcastRelayHeadNum);
    }else{
      return chalk.white("Broadcasting: ") + chalk.grey(broadcastRelayHeadNum);
    }
  }
  function renderConfirmation(){
    if(greatestConfirmedRelayHeadNum < confirmedRelayHeadNum){
      greatestConfirmedRelayHeadNum = confirmedRelayHeadNum;
      return  chalk.white("Relay Head: ") + chalk.green.bold(confirmedRelayHeadNum)
    }else{
      return  chalk.white("Relay Head: ") + chalk.grey(confirmedRelayHeadNum)
    }
  }
  function renderRinkebyBlockMined(){
    if(greatestRinkebyHead < rinkebyHead){
      greatestRinkebyHead = rinkebyHead
      return chalk.white("Rinkeby Head: ") + chalk.red.bold(rinkebyHead)
    }else{
      return chalk.white("Rinkeby Head: ") + chalk.grey(rinkebyHead)
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

  const numToBuf = (input)=>{ return new Buffer(byteable(input.toString(16)), 'hex') }
  const stringToBuf = (input)=>{ input=input.slice(2); return new Buffer(byteable(input), 'hex') }
  const byteable = (input)=>{ return input.length % 2 == 0 ? input : '0' + input }

  initVars().then(relay);
}
