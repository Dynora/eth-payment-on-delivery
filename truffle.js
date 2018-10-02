var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic = require('./local-mnemonic.json').mnemonic;

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: '*' // Match any network id
    },
    kovan: {
      provider: new HDWalletProvider(mnemonic, "https://kovan.infura.io/"),
      network_id: 42
    },
    rinkeby: {
      provider: function() { return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/"); },
      network_id: 4,
      gasPrice: 2000000000,
      gas: 60000000
    },
    mainnet: {
      provider: new HDWalletProvider(mnemonic, 'https://mainnet.infura.io'),
      network_id: 1
    }
  }
};
