var target = artifacts.require("./Target.sol");
var rbrelay = artifacts.require("./rbrelay.sol");
var rb20 = artifacts.require("./rb20.sol")

module.exports = function(deployer) {
	// web3.eth.getBlock("latest", (err,result) => {
		deployer.deploy(rb20).then(function() {
		    return deployer.deploy(rbrelay, "0x9cc20c925e71c1df0d409a6a25d9da2cb82ed3da95b76152a5082e0af35b5d47",617591,rb20.address/*result.hash, parseInt(result.number)*/);
		}).then(function() {
			return deployer.deploy(target);
		});
	// });
};
