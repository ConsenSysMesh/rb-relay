var target = artifacts.require("./Target.sol");
var rbrelay = artifacts.require("./rbrelay.sol");
var rb20 = artifacts.require("./rb20.sol")

module.exports = function(deployer) {
	// web3.eth.getBlock("latest", (err,result) => {
		deployer.deploy(rbrelay, "0xf74e9dbe971a9b3cc8fc2e8ab99dfc001436049c4ade777cf42fa99b1067dd4c", 617591);
		deployer.deploy(target);
	// });
};
