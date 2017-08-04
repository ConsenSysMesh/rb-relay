const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"))

var target = artifacts.require("./Target.sol");
var rbrelay = artifacts.require("./rbrelay.sol");

module.exports = function(deployer) {
	web3.eth.getBlock("latest", (err,result) => {
	    deployer.deploy(rbrelay, result.hash, parseInt(result.number));
	    deployer.deploy(target);
	}
};
