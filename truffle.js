const HDWalletProvider = require("truffle-hdwallet-provider");
const fs = require("fs");

// first read in the secrets.json to get our mnemonic
var secrets;
var mnemonic;
if(fs.existsSync("secrets.json")) {
  secrets = JSON.parse(fs.readFileSync("secrets.json", "utf8"));
  mnemonic = secrets.mnemonic;
} else {
  console.log("no secrets.json found. You can only deploy to the testrpc.");
  mnemonic = "" ;
}

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    },
    kovan: {
      provider: new HDWalletProvider(mnemonic, "https://kovan.infura.io/"),
      network_id: 42
    },
    ropsten: {
      provider: new HDWalletProvider(mnemonic, "https://ropsten.infura.io/"),
      gas: 4000000,
      gasLimit: 4000000,
      network_id: 3
    },
    rinkeby: {
      provider: new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/"),
      network_id: 4
    },
  }
};
