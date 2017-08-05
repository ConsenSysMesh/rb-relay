var target = artifacts.require("./Target.sol");
var rbrelay = artifacts.require("./rbrelay.sol");

module.exports = function(deployer) {
    //genesis block must have at least 2 tx in order for tests to pass
    deployer.deploy(rbrelay, "0xf74e9dbe971a9b3cc8fc2e8ab99dfc001436049c4ade777cf42fa99b1067dd4c", 617591);
    deployer.deploy(target);
};
