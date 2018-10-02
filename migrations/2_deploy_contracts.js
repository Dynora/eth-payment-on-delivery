var PaymentOnDelivery = artifacts.require('./PaymentOnDelivery.sol');

module.exports = function(deployer) {
  deployer.deploy(PaymentOnDelivery).then( function() {
  });
};
