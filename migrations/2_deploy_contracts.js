var target = artifacts.require("./Target.sol");
var rbrelay = artifacts.require("./rbrelay.sol");

module.exports = function(deployer, network) {
    deployer.deploy(rbrelay, "0x9cc20c925e71c1df0d409a6a25d9da2cb82ed3da95b76152a5082e0af35b5d47", 617590);
    deployer.deploy(target);
};
